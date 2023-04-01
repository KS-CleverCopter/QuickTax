#!/usr/local/opt/python/bin/python3.7
import sys
import traceback
from numpy import NaN
import pandas
import logging
import calc_util
import sqlalchemy
from sqlalchemy import text
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.sql.expression import Insert
import os
from dotenv import load_dotenv

load_dotenv()

app_base_path = os.getenv('app_base_path')
db_name = 'quicktax'
db_usr = 'quicktax'
db_pwd = 'qu1cktax'
db_host = 'localhost'

driver_waittime = 120

log_folder = app_base_path
args = sys.argv

@compiles(Insert)
def _prefix_insert_with_ignore(insert, compiler, **kw):
    return compiler.visit_insert(insert.prefix_with('IGNORE'), **kw)

logging.basicConfig(filename=log_folder+'pdf_calc.log', format='%(asctime)s %(levelname)s :%(message)s', datefmt='%d/%m/%Y %I:%M:%S %p', level=logging.INFO)
tb = "No error main"

try:
    sql_engine = sqlalchemy.create_engine('mysql+mysqlconnector://'+db_usr+':'+db_pwd+'@'+db_host+'/'+db_name+'?autocommit=true')
    db_connection = sql_engine.connect()
                            
    sel_qry = 'SELECT id, pdf_filename, file_path FROM pdf_files WHERE calc_status = 0 order by confirmed_datetime'
    files_df = pandas.read_sql(sql=text(sel_qry), con=db_connection)

    logging.info('Fetching pdf files to be processed')

    for index, row in files_df.iterrows(): 
        try : 
            file_id, pdf_filename, file_path = (str(row['id']), row['pdf_filename'], row['file_path'])
            print('File Name '+pdf_filename)
            logging.info("File ID :"+file_id+"File Name : ,"+pdf_filename+"File Path : ,"+file_path)

            db_connection.execute(text("UPDATE pdf_files set calc_status = 1, calc_datetime = current_timestamp(3) WHERE id = "+file_id))

            vista_res = calc_util.calc_ap_vista(file_id, db_connection, logging)
            futuro_res = calc_util.calc_result_futuro(file_id, db_connection, logging)
            compra_res = calc_util.calc_ap_compra_venda(file_id, db_connection, logging) # OPCAO DE COMPRA, OPCAO DE VENDA, TERMO
            

            db_connection.execute(text("UPDATE pdf_files set calc_status = 2, calc_datetime = current_timestamp(3) WHERE id = "+file_id))

        except Exception as ex: 
            db_connection.execute(text("UPDATE pdf_files set calc_status = 3, calc_datetime = current_timestamp(3), calc_error = '"+str(ex).replace("'",'')+"' WHERE id = "+file_id))
            traceback.print_exc(file=sys.stdout)
            logging.info('Exception >>')
            logging.info(ex)
            tb = traceback.format_exc()
except Exception as e : 
    #db_connection.execute("UPDATE pdf_files set calc_status = 3, calc_datetime = current_timestamp(3), calc_error = '"+str(e).replace("'",'')+"'WHERE id = "+file_id)
    logging.info('Exception ')
    logging.info(e)
    tb = traceback.format_exc()
    traceback.print_exc(file=sys.stdout)

logging.info(tb)