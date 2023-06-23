import sqlite3

extension = '../../core/dist/crsqlite'


def connect(db_file, uri=False):
    c = sqlite3.connect(db_file, uri=uri)
    c.enable_load_extension(True)
    c.load_extension(extension)
    return c


def close(c):
    c.execute("select crsql_finalize()")
    c.close()


min_db_v = 0
