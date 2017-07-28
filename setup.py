from setuptools import setup
import os


def read(fname):
    return open(os.path.join(os.path.dirname(__file__), fname)).read()

setup(
    name='enno',
    version='0.0.1',
    author="Tim Repke",
    author_email="tim@repke.eu",
    license="MIT",
    keywords="text annotation nlp",
    url="https://github.com/TimRepke/enno/",
    long_description=read('README.md'),
    py_modules=['enno'],
    include_package_data=True,
    zip_safe=False,
    install_requires=['Flask'],
)