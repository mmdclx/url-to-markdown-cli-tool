from setuptools import setup

setup(
    name='url-to-llm-friendly-markdown',
    version='0.1.0',
    py_modules=['cli'],
    package_dir={'': 'src'},
    install_requires=[
        'llm-reader @ git+https://github.com/m92vyas/llm-reader',
    ],
    entry_points={
        'console_scripts': [
            'url-to-llm=cli:main',
        ],
    },
)
