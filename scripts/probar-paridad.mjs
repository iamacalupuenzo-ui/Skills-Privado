// Standard-library unittest; no packages, models or network.
import { spawnSync } from 'node:child_process';
const command = process.env.PYTHON || (process.platform === 'win32' ? 'py' : 'python3');
const result = spawnSync(command, ['-m', 'unittest', 'discover', '-s', 'skills/paridad-diseno-desarrollo/tests', '-p', 'test_*.py'], { stdio: 'inherit' });
if (result.error) console.error(`No se pudo ejecutar Python 3.10+: ${result.error.message}`);
process.exit(result.status ?? 1);
