#!/usr/bin/env python3
import sys
import traceback
from numpy import NaN
import pandas
import sqlalchemy
from sqlalchemy import text
import os
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

app_base_path = os.getenv('app_base_path')
db_name = 'quicktax'
db_usr = 'quicktax'
db_pwd = 'qu1cktax'
db_host = 'localhost'

tb = "No error main"

try:
    if (len(sys.argv) > 1):
        client_id = sys.argv[1]
        allMon = sys.argv[2]
        mmYY = sys.argv[3]
        fileName = "files_exp/"+sys.argv[4]

        sql_engine = sqlalchemy.create_engine('mysql+mysqlconnector://'+db_usr+':'+db_pwd+'@'+db_host+'/'+db_name+'?autocommit=true')

        ap_proc = "call export_data_operations('"+client_id+"', '"+allMon+"', '"+mmYY+"')";
        portfolio_proc = "call export_data_portfolio('"+client_id+"', '"+allMon+"', '"+mmYY+"')";
        processed_proc = "call export_data_processed('"+client_id+"', '"+allMon+"', '"+mmYY+"')";
        
        connection = sql_engine.connect().connection
        cursor = connection.cursor(buffered=True)

        cursor.execute(ap_proc)
        rows = cursor.fetchall()

        # Results set 1
        column_names = [col[0] for col in cursor.description] # Get column names from MySQL
        op_data = []
        for row in rows:
            op_data.append({name: row[i] for i, name in enumerate(column_names)})
        print(op_data)

        cursor.nextset()
        column_names = [col[0] for col in cursor.description] 
        portfolio_data = []
        for row in cursor.fetchall():
             portfolio_data.append({name: row[j] for j, name in enumerate(column_names)})
        print(portfolio_data)

        cursor.nextset()
        column_names = [col[0] for col in cursor.description] 
        processed_data = []
        for row in cursor.fetchall():
             processed_data.append({name: row[j] for j, name in enumerate(column_names)})
        print(processed_data)   
        cursor.close()

        with pandas.ExcelWriter(app_base_path+fileName) as writer:
            pandas.DataFrame(op_data).to_excel(writer, sheet_name="Operações", index=False)
            pandas.DataFrame(portfolio_data).to_excel(writer, sheet_name="Carteira", index=False)
            pandas.DataFrame(processed_data).to_excel(writer, sheet_name="ProcessedData", index=False)
        print(fileName)

except Exception as e:
    print(e)
    tb = traceback.format_exc()
    traceback.print_exc(file=sys.stdout)
