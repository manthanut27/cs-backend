const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const supabase = require('../lib/supabase');
const AlertService = require('./AlertService');
const { broadcast } = require('../ws/WebSocketServer');
const { isSystemFile } = require('../utils/riskRules');
const logger = require('../utils/logger');

const HASHES_FILE = path.join(__dirname, '../data/hashes.json');
let watchers = {};

// --- Local JSON store helpers ---
function loadHashes() {
  try {
    return JSON.parse(fs.readFileSync(HASHES_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

function saveHashes(data) {
  fs.writeFileSync(HASHES_FILE, JSON.stringify(data, null, 2));
}

// --- Core functions ---
function hashFile(filePath) {
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Add a file to the watchlist
 */
async function addFile(filePath) {
  // Validate file exists
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found or unreadable: ${filePath}`);
  }

  const stats = fs.statSync(filePath);
  if (stats.isDirectory()) {
    throw new Error('Directory monitoring not yet supported. Please add individual files.');
  }

  const hash = hashFile(filePath);

  // Save to Supabase if available
  if (supabase) {
    const { error } = await supabase.from('file_hashes').upsert({
      file_path: filePath,
      baseline_hash: hash,
      last_hash: hash,
      status: 'clean',
      last_checked: new Date().toISOString(),
    }, { onConflict: 'file_path' });
    if (error) logger.error('Supabase upsert error:', error.message);
  }

  // Save to local store
  const hashes = loadHashes();
  hashes[filePath] = {
    hash,
    baseline_hash: hash,
    status: 'clean',
    addedAt: Date.now(),
    lastChecked: Date.now(),
  };
  saveHashes(hashes);

  // Start watching this file
  startFileWatcher(filePath);

  return { file_path: filePath, hash };
}

/**
 * Remove a file from the watchlist
 */
async function removeFile(filePath) {
  // Remove from Supabase
  if (supabase) {
    await supabase.from('file_hashes').delete().eq('file_path', filePath);
  }

  // Remove from local store
  const hashes = loadHashes();
  delete hashes[filePath];
  saveHashes(hashes);

  // Stop watcher
  if (watchers[filePath]) {
    watchers[filePath].close();
    delete watchers[filePath];
  }

  return { removed: filePath };
}

/**
 * Get all monitored files with status
 */
async function getAllFiles() {
  // Try Supabase first
  if (supabase) {
    const { data, error } = await supabase
      .from('file_hashes')
      .select('*')
      .order('added_at', { ascending: false });
    if (!error && data) {
      const total = data.length;
      const clean = data.filter(f => f.status === 'clean').length;
      const modified = data.filter(f => f.status === 'modified').length;
      const missing = data.filter(f => f.status === 'missing').length;
      return {
        files: data,
        summary: { total, clean, modified, missing },
      };
    }
  }

  // Fallback to local JSON
  const hashes = loadHashes();
  const files = Object.entries(hashes).map(([filepath, info]) => ({
    file_path: filepath,
    baseline_hash: info.baseline_hash || info.hash,
    last_hash: info.last_hash || info.hash,
    status: info.status || 'clean',
    last_checked: info.lastChecked ? new Date(info.lastChecked).toISOString() : null,
    added_at: info.addedAt ? new Date(info.addedAt).toISOString() : null,
  }));

  const total = files.length;
  const clean = files.filter(f => f.status === 'clean').length;
  const modified = files.filter(f => f.status === 'modified').length;
  const missing = files.filter(f => f.status === 'missing').length;

  return { files, summary: { total, clean, modified, missing } };
}

/**
 * Get file change history
 */
async function getHistory(limit = 50) {
  if (supabase) {
    const { data } = await supabase
      .from('file_change_events')
      .select('*')
      .order('detected_at', { ascending: false })
      .limit(limit);
    return { changes: data || [] };
  }
  return { changes: [] };
}

/**
 * Handle file change detected by watcher
 */
async function onFileChanged(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      // File was deleted
      const hashes = loadHashes();
      if (hashes[filePath]) {
        hashes[filePath].status = 'missing';
        saveHashes(hashes);
      }
      if (supabase) {
        await supabase.from('file_hashes').update({ status: 'missing', last_checked: new Date().toISOString() }).eq('file_path', filePath);
      }
      return;
    }

    const newHash = hashFile(filePath);
    const hashes = loadHashes();
    const oldHash = hashes[filePath]?.baseline_hash || hashes[filePath]?.hash;

    if (newHash !== oldHash) {
      // File modified!
      hashes[filePath].last_hash = newHash;
      hashes[filePath].status = 'modified';
      hashes[filePath].lastChecked = Date.now();
      saveHashes(hashes);

      const severity = isSystemFile(filePath) ? 'CRITICAL' : 'HIGH';

      // Log change event in Supabase
      if (supabase) {
        await supabase.from('file_change_events').insert({
          file_path: filePath,
          old_hash: oldHash,
          new_hash: newHash,
        });
        await supabase.from('file_hashes').update({
          last_hash: newHash,
          status: 'modified',
          last_checked: new Date().toISOString(),
        }).eq('file_path', filePath);
      }

      // Create alert
      await AlertService.createAlert({
        source: 'file_integrity',
        type: 'file_change',
        severity,
        title: `${severity === 'CRITICAL' ? 'System file' : 'File'} modified`,
        detail: `${filePath} hash changed`,
      });

      // Broadcast via WebSocket
      broadcast('file_change', {
        path: filePath,
        oldHash,
        newHash,
        severity,
        timestamp: new Date().toISOString(),
      });

      logger.warn(`File modified: ${filePath} [${severity}]`);
    } else {
      hashes[filePath].lastChecked = Date.now();
      hashes[filePath].status = 'clean';
      saveHashes(hashes);
    }
  } catch (err) {
    logger.error(`Error checking file ${filePath}:`, err.message);
  }
}

/**
 * Start watching a single file
 */
function startFileWatcher(filePath) {
  if (watchers[filePath]) return; // Already watching

  try {
    const watcher = chokidar.watch(filePath, { persistent: true, ignoreInitial: true });
    watcher.on('change', () => onFileChanged(filePath));
    watcher.on('unlink', () => onFileChanged(filePath));
    watcher.on('error', (err) => logger.error(`Watcher error for ${filePath}:`, err.message));
    watchers[filePath] = watcher;
  } catch (err) {
    logger.error(`Failed to start watcher for ${filePath}:`, err.message);
  }
}

/**
 * Start watchers for all previously monitored files
 */
function startAllWatchers() {
  const hashes = loadHashes();
  const paths = Object.keys(hashes);
  for (const p of paths) {
    if (fs.existsSync(p)) {
      startFileWatcher(p);
    }
  }
  logger.info(`File watchers active for ${paths.length} files`);
}

module.exports = { addFile, removeFile, getAllFiles, getHistory, hashFile, startAllWatchers };
