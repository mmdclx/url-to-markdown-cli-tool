# -*- mode: python ; coding: utf-8 -*-


a = Analysis(
    ['src/cli.py'],
    pathex=['src'],
    binaries=[],
    datas=[('src/page_fetcher.py', '.'), ('src/markdown_processor.py', '.')],
    hiddenimports=['page_fetcher', 'markdown_processor', 'selenium', 'beautifulsoup4', 'html2text', 'lxml'],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='url-to-llm-friendly-md',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
