import json
A='/home/claude/topdown/assets/'
ch=json.load(open(A+'chars.json')); env=json.load(open(A+'env.json')); cr=json.load(open(A+'credits.json'))
with open(A+'data.js','w') as f:
    f.write('const CHARS='+json.dumps(ch,separators=(',',':'))+';\n')
    f.write('const ENV='+json.dumps(env,separators=(',',':'))+';\n')
    f.write('const CREDITS='+json.dumps(cr,ensure_ascii=False,separators=(',',':'))+';\n')
print('ok')
