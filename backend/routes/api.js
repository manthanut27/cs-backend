const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const si = require('systeminformation');
const zxcvbn = require('zxcvbn');
const { supabase } = require('../supabaseClient');

const router = express.Router();

// Helper to wrap async route handlers
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Simple guard to ensure Supabase is configured
function requireSupabase(res) {
  if (!supabase) {
    res.status(500).json({
      error: true,
      message: 'Supabase is not configured on the backend',
    });
    return false;
  }
  return true;
}

// 1. System Audit
router.get(
  '/audit',
  asyncHandler(async (req, res) => {
    try {
      const [processData, serviceData, netConns] = await Promise.all([
        si.processes(),
        // On some platforms this can be slow; keep the list generic
        si.services('*'),
        si.networkConnections(),
      ]);

      const processes = (processData.list || []).map((p) => ({
        pid: p.pid,
        user: p.user,
        cpu: p.pcpu?.toFixed ? p.pcpu.toFixed(1) : String(p.pcpu ?? ''),
        mem: p.pmem?.toFixed ? p.pmem.toFixed(1) : String(p.pmem ?? ''),
        command: p.name || p.command,
      }));

      const ports = (netConns || [])
        .filter((c) => c.localport)
        .map((c) => ({
          protocol: c.protocol || 'tcp',
          port: c.localport,
          state: c.state,
        }));

      const services = (serviceData || []).map((s) => ({
        name: s.name,
        status: s.state,
      }));

      const riskFlags = [];

      const riskyPorts = new Set([21, 23, 445]);
      for (const p of ports) {
        if (riskyPorts.has(Number(p.port))) {
          riskFlags.push({
            level: 'HIGH',
            message: `Port ${p.port} (${p.protocol.toUpperCase()}) is open`,
          });
        }
      }

      const suspiciousProcesses = processes.filter(
        (p) =>
          (p.user === 'root' || p.user === 'SYSTEM') &&
          p.command &&
          !/^(systemd|nginx|sshd|services|svchost)/i.test(p.command),
      );

      for (const sp of suspiciousProcesses) {
        riskFlags.push({
          level: 'MEDIUM',
          message: `Suspicious privileged process: ${sp.command} (PID ${sp.pid})`,
        });
      }

      res.json({
        timestamp: new Date().toISOString(),
        processes,
        ports,
        services,
        riskFlags,
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error in /api/audit', err);
      res
        .status(500)
        .json({ error: true, message: 'Failed to read system processes' });
    }
  }),
);

// 2. File Integrity

// Utility: compute SHA-256 of a file
function computeFileHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('error', (err) => reject(err));
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

router.get(
  '/integrity/status',
  asyncHandler(async (req, res) => {
    if (!requireSupabase(res)) return;
    const { data, error } = await supabase
      .from('file_hashes')
      .select('*')
      .order('file_path', { ascending: true });

    if (error) {
      // eslint-disable-next-line no-console
      console.error('Supabase error /integrity/status', error);
      return res
        .status(500)
        .json({ error: true, message: 'Failed to load integrity status' });
    }

    const files = data || [];
    const summary = {
      total: files.length,
      clean: files.filter((f) => f.status === 'clean').length,
      modified: files.filter((f) => f.status === 'modified').length,
      missing: files.filter((f) => f.status === 'missing').length,
    };

    res.json({ files, summary });
  }),
);

router.post(
  '/integrity/add',
  asyncHandler(async (req, res) => {
    if (!requireSupabase(res)) return;

    const { path: targetPath } = req.body || {};
    if (!targetPath || typeof targetPath !== 'string') {
      return res
        .status(400)
        .json({ error: true, message: 'path is required' });
    }

    const absPath = path.resolve(targetPath);

    try {
      await fs.promises.access(absPath, fs.constants.R_OK);
    } catch {
      return res.status(400).json({
        error: true,
        message: `File not found or unreadable: ${targetPath}`,
      });
    }

    try {
      const hash = await computeFileHash(absPath);

      const { error } = await supabase.from('file_hashes').upsert(
        {
          file_path: absPath,
          baseline_hash: hash,
          last_hash: hash,
          status: 'clean',
        },
        { onConflict: 'file_path' },
      );

      if (error) {
        // eslint-disable-next-line no-console
        console.error('Supabase error /integrity/add', error);
        return res.status(500).json({
          error: true,
          message: 'Failed to add file to watchlist',
        });
      }

      res.status(201).json({
        success: true,
        file_path: absPath,
        hash,
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error computing hash in /integrity/add', err);
      res.status(500).json({
        error: true,
        message: `Failed to hash file: ${targetPath}`,
      });
    }
  }),
);

router.delete(
  '/integrity/remove',
  asyncHandler(async (req, res) => {
    if (!requireSupabase(res)) return;
    const { path: targetPath } = req.body || {};
    if (!targetPath || typeof targetPath !== 'string') {
      return res
        .status(400)
        .json({ error: true, message: 'path is required' });
    }
    const absPath = path.resolve(targetPath);

    const { error } = await supabase
      .from('file_hashes')
      .delete()
      .eq('file_path', absPath);

    if (error) {
      // eslint-disable-next-line no-console
      console.error('Supabase error /integrity/remove', error);
      return res.status(500).json({
        error: true,
        message: 'Failed to remove file from watchlist',
      });
    }

    res.json({ success: true, removed: absPath });
  }),
);

router.get(
  '/integrity/history',
  asyncHandler(async (req, res) => {
    if (!requireSupabase(res)) return;
    const limit = Number(req.query.limit) || 50;

    const { data, error } = await supabase
      .from('file_change_events')
      .select('*')
      .order('detected_at', { ascending: false })
      .limit(limit);

    if (error) {
      // eslint-disable-next-line no-console
      console.error('Supabase error /integrity/history', error);
      return res.status(500).json({
        error: true,
        message: 'Failed to load file change history',
      });
    }

    res.json({ changes: data || [] });
  }),
);

// 3. Network Monitor
router.get(
  '/network/scan',
  asyncHandler(async (req, res) => {
    if (!requireSupabase(res)) return;

    // For now we treat Supabase `network_devices` as the source of truth.
    // Separate background jobs can populate it via real scans.
    const { data, error } = await supabase
      .from('network_devices')
      .select('*')
      .order('last_seen', { ascending: false });

    if (error) {
      // eslint-disable-next-line no-console
      console.error('Supabase error /network/scan', error);
      return res.status(500).json({
        error: true,
        message: 'Failed to load network devices',
      });
    }

    const devices = (data || []).map((d) => ({
      ip_address: d.ip_address,
      mac_address: d.mac_address,
      hostname: d.hostname,
      is_trusted: d.is_trusted,
      last_seen: d.last_seen,
    }));

    const unknownCount = devices.filter((d) => !d.is_trusted).length;

    res.json({
      scanned_at: new Date().toISOString(),
      devices,
      unknownCount,
    });
  }),
);

router.patch(
  '/network/trust',
  asyncHandler(async (req, res) => {
    if (!requireSupabase(res)) return;
    const { mac_address } = req.body || {};
    if (!mac_address) {
      return res
        .status(400)
        .json({ error: true, message: 'mac_address is required' });
    }

    const { error } = await supabase
      .from('network_devices')
      .update({ is_trusted: true })
      .eq('mac_address', mac_address);

    if (error) {
      // eslint-disable-next-line no-console
      console.error('Supabase error /network/trust', error);
      return res.status(500).json({
        error: true,
        message: 'Failed to update device trust status',
      });
    }

    res.json({ success: true, mac_address, is_trusted: true });
  }),
);

// 4. Password Strength
router.post(
  '/password/check',
  asyncHandler(async (req, res) => {
    const { password } = req.body || {};
    if (typeof password !== 'string' || password.length === 0) {
      return res
        .status(400)
        .json({ error: true, message: 'password is required' });
    }

    const result = zxcvbn(password);

    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSymbols = /[^A-Za-z0-9]/.test(password);

    const commonPassword =
      (result.sequence || []).some((s) => s.pattern === 'dictionary') &&
      result.crack_times_seconds.offline_slow_hashing_1e4_per_second < 1e6;

    const entropyBits = result.guesses_log10 * 3.32193;

    let score = 0;
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (hasUppercase) score += 1;
    if (hasLowercase) score += 1;
    if (hasNumbers) score += 1;
    if (hasSymbols) score += 1;
    if (!commonPassword) score += 1;

    const strengthLabel =
      score <= 2
        ? 'Weak'
        : score <= 4
        ? 'Fair'
        : score === 5
        ? 'Good'
        : score === 6
        ? 'Strong'
        : 'Very Strong';

    const suggestions = [];
    if (password.length < 12) {
      suggestions.push('Use at least 12 characters for better security');
    }
    if (!hasSymbols) {
      suggestions.push('Add symbols like ! @ # $ to increase strength');
    }
    if (commonPassword) {
      suggestions.push('Avoid using common or easily guessed passwords');
    }
    if (
      (result.sequence || []).some((s) => s.pattern === 'dictionary')
    ) {
      suggestions.push(
        "Avoid using dictionary words or simple names in your password",
      );
    }
    if (result.feedback && result.feedback.suggestions) {
      suggestions.push(...result.feedback.suggestions);
    }

    res.json({
      score,
      strength: strengthLabel,
      entropy_bits: Number(entropyBits.toFixed(1)),
      checks: {
        length: password.length >= 8,
        uppercase: hasUppercase,
        lowercase: hasLowercase,
        numbers: hasNumbers,
        symbols: hasSymbols,
        not_common: !commonPassword,
        no_dict_word: !(
          (result.sequence || []).some((s) => s.pattern === 'dictionary')
        ),
      },
      suggestions,
    });
  }),
);

// 5. Security Logs
router.get(
  '/logs',
  asyncHandler(async (req, res) => {
    if (!requireSupabase(res)) return;
    const limit = Number(req.query.limit) || 100;
    const severity = req.query.severity;

    let query = supabase
      .from('auth_log_events')
      .select('*')
      .order('detected_at', { ascending: false })
      .limit(limit);

    if (severity) {
      query = query.eq('severity', severity);
    }

    const { data, error } = await query;

    if (error) {
      // eslint-disable-next-line no-console
      console.error('Supabase error /logs', error);
      return res.status(500).json({
        error: true,
        message: 'Failed to load security logs',
      });
    }

    const events = data || [];
    const summary = {
      total: events.length,
      critical: events.filter((e) => e.severity === 'CRITICAL').length,
      high: events.filter((e) => e.severity === 'HIGH').length,
      medium: events.filter((e) => e.severity === 'MEDIUM').length,
      low: events.filter((e) => e.severity === 'LOW').length,
    };

    res.json({ events, summary });
  }),
);

// 6. Alerts
router.get(
  '/alerts',
  asyncHandler(async (req, res) => {
    if (!requireSupabase(res)) return;
    const limit = Number(req.query.limit) || 50;
    const unacknowledged = String(req.query.unacknowledged || '').toLowerCase();

    let query = supabase
      .from('security_alerts')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (unacknowledged === 'true') {
      query = query.eq('acknowledged', false);
    }

    const { data, error } = await query;

    if (error) {
      // eslint-disable-next-line no-console
      console.error('Supabase error /alerts', error);
      return res.status(500).json({
        error: true,
        message: 'Failed to load alerts',
      });
    }

    const alerts = data || [];
    const counts = alerts.reduce(
      (acc, a) => {
        acc[a.severity.toLowerCase()] =
          (acc[a.severity.toLowerCase()] || 0) + 1;
        return acc;
      },
      { critical: 0, high: 0, medium: 0, low: 0 },
    );

    res.json({ alerts, counts });
  }),
);

router.patch(
  '/alerts/:id/acknowledge',
  asyncHandler(async (req, res) => {
    if (!requireSupabase(res)) return;

    const { id } = req.params;
    const { error } = await supabase
      .from('security_alerts')
      .update({ acknowledged: true })
      .eq('id', id);

    if (error) {
      // eslint-disable-next-line no-console
      console.error('Supabase error /alerts/:id/acknowledge', error);
      return res.status(500).json({
        error: true,
        message: 'Failed to acknowledge alert',
      });
    }

    res.json({ success: true, id, acknowledged: true });
  }),
);

router.patch(
  '/alerts/acknowledge-all',
  asyncHandler(async (req, res) => {
    if (!requireSupabase(res)) return;

    const { error, count } = await supabase
      .from('security_alerts')
      .update({ acknowledged: true })
      .eq('acknowledged', false);

    if (error) {
      // eslint-disable-next-line no-console
      console.error('Supabase error /alerts/acknowledge-all', error);
      return res.status(500).json({
        error: true,
        message: 'Failed to acknowledge all alerts',
      });
    }

    res.json({
      success: true,
      acknowledged_count: typeof count === 'number' ? count : null,
    });
  }),
);

// 7. Health Check
router.get(
  '/health',
  asyncHandler(async (req, res) => {
    let supabaseConnected = false;
    if (supabase) {
      try {
        const { error } = await supabase
          .from('file_hashes')
          .select('id', { head: true, count: 'exact' })
          .limit(1);
        supabaseConnected = !error;
      } catch {
        supabaseConnected = false;
      }
    }

    res.json({
      status: 'ok',
      uptime_seconds: Math.round(process.uptime()),
      supabase_connected: supabaseConnected,
      watchers_active: 0,
      log_tailer_active: false,
    });
  }),
);

module.exports = router;

