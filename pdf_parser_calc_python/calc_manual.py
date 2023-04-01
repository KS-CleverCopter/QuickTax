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

logging.basicConfig(filename=log_folder+'pdf_calc_manual.log', format='%(asctime)s %(levelname)s :%(message)s', datefmt='%d/%m/%Y %I:%M:%S %p', level=logging.INFO)
tb = "No error main"

try:
    sql_engine = sqlalchemy.create_engine('mysql+mysqlconnector://'+db_usr+':'+db_pwd+'@'+db_host+'/'+db_name+'?autocommit=true')
    db_connection = sql_engine.connect()

    #ticker 
    db_connection.execute(text("UPDATE trade_data2 LEFT JOIN tickers b ON REPLACE(REGEXP_REPLACE(t_title_spec, ' EJ | ES | ED | EB | ER | EX | EC | EG ', ' '), '  ',' ')  = title_to_search SET d_ticker = IF(ticker_name IS NULL, t_title_spec, ticker_name) WHERE manual = 1 and processed = 0"));
    db_connection.execute(text("UPDATE trade_data2 SET d_market = (case when t_market_type in ('VISTA','FRACIONARIO') then 'VISTA_FRACIONARIO' else t_market_type end) WHERE manual = 1 and processed = 0"));

    # sel_qry = 'SELECT id from trade_data2 WHERE manual = 1 AND processed = 0';
    sel_qry = 'SELECT id from trade_data2 WHERE processed = 0';
    manual_df = pandas.read_sql(sql=text(sel_qry), con=db_connection)

    logging.info('Fetching pdf files to be processed')

    for index, row in manual_df.iterrows(): 
        try : 
            id = str(row['id'])
            print('ID '+id)
            logging.info("ID :"+id)

            db_connection.execute(text("UPDATE trade_data2 set processed = 1, processed_time = now() WHERE id = "+id)) #in progress

            vista_res = calc_util.calc_ap_vista_manual(id, db_connection, logging)
            # futuro_res = calc_util.calc_result_futuro(file_id, db_connection, logging)
            compra_res = calc_util.calc_ap_compra_venda_manual(id, db_connection, logging) # OPCAO DE COMPRA, OPCAO DE VENDA
            
            db_connection.execute(text("UPDATE trade_data2 set processed = 2, processed_time = now() WHERE id = "+id)) # success 

        except Exception as ex: 
            db_connection.execute(text("UPDATE trade_data2 set processed = 3, processed_time = now() WHERE id = "+id)) # error
            traceback.print_exc(file=sys.stdout)
            logging.info('Exception >>')
            logging.info(ex)
            tb = traceback.format_exc()
except Exception as e : 
    logging.info('Exception ')
    logging.info(e)
    tb = traceback.format_exc()
    traceback.print_exc(file=sys.stdout)

logging.info(tb)