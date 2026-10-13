from pathlib import Path
import re, sys

REQUIRED = ['artifact:', 'okf:', 'generated:', 'verified:', 'status:', 'sources:', 'provenance:', '## Identity', '## Angular contract', '## Behavior and visual contract', '## Accessibility and security', '## Verification', '## Traceability']
ALLOWED = {'READY_FOR_DEV', 'REQUIRES_REVIEW', 'BLOCKED'}

def validate(path: Path):
    text = path.read_text(encoding='utf-8')
    errors = [f'missing: {x}' for x in REQUIRED if x not in text]
    m = re.search(r'^status:\s*(\S+)', text, re.M)
    if not m or m.group(1) not in ALLOWED:
        errors.append('status must be READY_FOR_DEV, REQUIRES_REVIEW or BLOCKED')
    if re.search(r'(?i)human-reviewed\s*:\s*true|human_reviewed\s*:\s*true', text):
        errors.append('agents cannot set human-reviewed true')
    return errors

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print('usage: python validate_component_spec.py COMPONENT.md')
        raise SystemExit(2)
    errs = validate(Path(sys.argv[1]))
    if errs:
        print('\n'.join(errs)); raise SystemExit(1)
    print('valid component specification envelope')
