#!/usr/bin/python3
import sys
import os, traceback
import pandas
import json
import logging
import parser_util
import sqlalchemy
import pdfrw
from sqlalchemy import text
from subprocess import call, run 
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.sql.expression import Insert
from pandas.io.json import json_normalize
from PyPDF2 import PdfWriter, PdfReader
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as ec
from selenium.webdriver.common.by import By
from selenium.common.exceptions import TimeoutException
import os
from dotenv import load_dotenv

load_dotenv()

app_base_path = os.getenv('app_base_path')
chrome_driver = os.getenv('chrome_driver')

db_name = 'quicktax'
db_usr = 'quicktax'
db_pwd = 'qu1cktax'
db_host = 'localhost'
pdf_parse_url = "http://localhost/quicktax/pdf.html"
pdf_safra_parse_url = "http://localhost/quicktax/pdf_safra.html"

driver_waittime = 120

log_folder = app_base_path
pdf_path = app_base_path+'uploads/parsedFiles/'    
img_folder_base = log_folder
img_folder = img_folder_base + 'property_img/'
pdf_html_base_path = 'uploads/parsedFiles/'
args = sys.argv

@compiles(Insert)
def _prefix_insert_with_ignore(insert, compiler, **kw):
    return compiler.visit_insert(insert.prefix_with('IGNORE'), **kw)

chrome_options = Options()
# chrome_options.headless = True
chrome_options.add_argument("--headless")
chrome_options.add_argument("--no-sandbox")
chrome_options.add_argument("--disable-setuid-sandbox")

logging.basicConfig(filename=log_folder+'pdf_extract.log', format='%(asctime)s %(levelname)s :%(message)s', datefmt='%d/%m/%Y %I:%M:%S %p', level=logging.INFO)
tb = "No error main"

try:
    sql_engine = sqlalchemy.create_engine('mysql+mysqlconnector://'+db_usr+':'+db_pwd+'@'+db_host+'/'+db_name+'?autocommit=true')
    db_connection = sql_engine.connect()
    
    sel_qry = 'SELECT id, pdf_filename, file_path, process_status, file_type FROM pdf_files WHERE process_status = 0 order by id'
    files_df = pandas.read_sql(sql=text(sel_qry), con=db_connection)

    logging.info('Fetching pdf files to be processed')

    for index, row in files_df.iterrows(): 
        try : 
            file_id, pdf_filename, file_path, file_type = (str(row['id']), row['pdf_filename'], row['file_path'], row['file_type'])

            logging.info("File ID : "+file_id+"File Name : "+pdf_filename+"File Path : "+file_path)

            db_connection.execute(text("UPDATE pdf_files set process_status = 1, processed_datetime = current_timestamp(3) WHERE id = "+file_id))

            final_df = []
            xmlfiles = ""
            page_images = pandas.DataFrame()

            try : 
                inputpdf = PdfReader(open(file_path, "rb"), strict=False)
            except Exception as pe : 
                if ( 'EOF marker not found' == str(pe) ) : 
                    x = pdfrw.PdfReader(file_path)
                    y = pdfrw.PdfWriter()
                    y.addpages(x.pages)
                    new_file_name = file_path.replace('.pdf', '') + '_fixed.pdf'
                    y.write(new_file_name)
                    inputpdf = PdfReader(open(new_file_name,"rb"))
                else :
                    logging.info(pe)

            logging.info('No.of Pages : '+str(len(inputpdf.pages)))
            for i in range(len(inputpdf.pages)):
                page_no = str(i+1)
                #logging.info('Page No : '+page_no)
                base_file_name = pdf_filename[:pdf_filename.index(".")]+"_"+page_no
                pdf_page_file = pdf_path + base_file_name + ".pdf"
                xml_page_file = pdf_path + base_file_name + ".xml"

                if ( os.path.exists(pdf_page_file) ) : 
                    os.unlink(pdf_page_file)
                if ( os.path.exists(xml_page_file) ) :
                    os.unlink(xml_page_file)

                output = PdfWriter()
                page = inputpdf.pages[i]
                output.add_page(page)
                
                with open(pdf_page_file, "wb") as outputStream:
                    output.write(outputStream)
                
                try: 
                    logging.info("Creating XML file "+xml_page_file+", "+pdf_page_file)
                    os.system('/usr/local/bin/pdf2txt.py -o '+xml_page_file+' '+pdf_page_file)
                except Exception as ee : 
                    logging.info("pdf2txt exception "+ee)

                xml_file = pdf_html_base_path+base_file_name+".xml"
                xmlfiles = xmlfiles + xml_file + ','

            xmlfiles = xmlfiles[:-1]
            logging.info('XML Files : '+xmlfiles)  

            # if ( running_env == 'prod' ) : 
            #     # driver = webdriver.Chrome(chrome_options=chrome_options, executable_path=chrome_driver)
            #     driver = webdriver.Chrome(options=chrome_options)
            #     # driver = webdriver.Chrome(chrome_driver, chrome_options=chrome_options)
            # else : 
            #     driver = webdriver.Chrome(options=chrome_options, executable_path=chrome_driver)

            driver = webdriver.Chrome(options=chrome_options)
            logging.info('File Type '+file_type)
            if ( file_type == 'safra' ) : 
                driver.get(pdf_safra_parse_url)
            else : 
                driver.get(pdf_parse_url)
            # logging.info(driver.title)

            logging.info('Parsing XMLs using Chrome web driver')
            try :
                driver.implicitly_wait(30)
                driver.execute_script("looper('"+xmlfiles+"');")

                WebDriverWait(driver, 120).until(
                    ec.text_to_be_present_in_element((By.ID, 'outputStatus'), "completed"))

                logging.info('Waiting till outputStatus becomes Done')
            except TimeoutException as e : 
                logging.info('TimeoutException')

            op_status = WebDriverWait(driver, 5).until(ec.presence_of_element_located((By.ID , 'outputStatus'))).text
            pdf_data_json = WebDriverWait(driver, 5).until(ec.presence_of_element_located((By.ID , 'output'))).text
            
            logging.info(str(pdf_data_json).encode('utf-8'))
            logging.info('Status '+op_status)
            
            driver.close()
            driver.quit()

            if ( pdf_data_json == '' or pdf_data_json == '[]' ) :
                logging.info('Parsed Data is empty !!')
                db_connection.execute(text("UPDATE pdf_files set process_status = 3, processed_datetime = current_timestamp(3), error_message = 'No parsed Data!' WHERE id = "+file_id))
            else :  
                logging.info('json parsing start')
                op_json_arr1 = json.loads(pdf_data_json)
                op_json_arr = sorted(op_json_arr1,  key=lambda x: int(x['input'][x['input'].rfind('_')+1:x['input'].rfind('.xml')]))

                logging.info(op_json_arr)
                logging.info('json parsing end')

                if ( len(op_json_arr) == 0 ) : 
                    logging.info('Parsed data is empty')
                    db_connection.execute(text("UPDATE pdf_files set process_status = 3, processed_datetime = current_timestamp(3), error_message = 'No parsed Data!' WHERE id = "+file_id))
                else : 
                    logging.info('parsed date is not empty')

                    base_df_headers = ['page', 'note_no', 'trading_date','client_id']
                    others_headers_1 = ['operating_fee','registration_fee_BM_F','rate_BM_F','iss','total_expenses']
                    table_headers_1 = ['t_CV','t_merchandise','t_due_date','t_quantity','t_price_adjustment','t_business_type','t_operation_adjustment_val','t_DC','t_operating_fee']

                    others_headers_2 = ['settlement_fee','registration_fee','fees','clearing','iss','IRRF_without_operations_base','others','operations_value']
                    table_headers_2 = ['t_Q','t_negotiation','t_CV','t_market_type','t_deadline','t_title_spec','t_note','t_quantity','t_price_adjustment','t_operation_adjustment_val','t_DC']
                    files_success = 0

                    for op_json in op_json_arr: 

                        final_table_df = pandas.DataFrame()
                        final_main_df = pandas.DataFrame()
                        final_df = pandas.DataFrame()
                        pdf_type = 1
                        client_id_key = 'C.N.P.J/C.P.F' # for pdf_type=1
                        date_key = 'Data pregão'

                        df_json = pandas.json_normalize(op_json)
                        others_json = pandas.json_normalize(df_json['result.others'][0])
                        table_json = pandas.json_normalize(df_json['result.table'][0])

                        others_headers = others_headers_1
                        table_headers = table_headers_1

                        if ( 'C.P.F./C.N.P.J/C.V.M./C.O.B.' in others_json.columns or 'C.P.F./C.N.P.J./C.V.M./C.O.B.' in others_json.columns ) : #C.P.F./C.N.P.J/C.V.M./C.O.B. #Taxa de liquidação
                            client_id_key = 'C.P.F./C.N.P.J/C.V.M./C.O.B.'
                            if ( 'C.P.F./C.N.P.J./C.V.M./C.O.B.' in others_json.columns ) : 
                                client_id_key = 'C.P.F./C.N.P.J./C.V.M./C.O.B.'
                            pdf_type = 2
                            others_headers = others_headers_2
                            table_headers = table_headers_2

                        base_df_data = [df_json['input'], others_json['Nr. nota'], others_json[date_key], others_json[client_id_key]]
                        base_df = pandas.concat(base_df_data, axis=1, keys=base_df_headers)
                        base_df['trading_date'] = base_df['trading_date'].apply(lambda x : parser_util.formatDate(x))

                        final_table_df = parser_util.parseTable(pdf_type, table_json, table_headers, base_df, base_df_headers, logging)
                        if ( final_table_df.empty ) : 
                            logging.info('Invalid PDF page '+df_json['input'])
                            continue
                        else : 
                            files_success += 1
                            final_main_df =  parser_util.parseMain(pdf_type, others_json, others_headers, base_df, base_df_headers, logging)
                            
                            final_df = pandas.merge(final_main_df, final_table_df, how="outer")
                            final_df['file_id'] = file_id
                            final_df['file_name'] = pdf_filename
                            final_df['page_no'] = final_df['page'].apply(lambda x: x[x.rfind('_')+1:x.rfind('.xml')])

                            # final_df.to_csv(log_folder+'final_data_'+file_id+'.csv')
                        
                            try:
                                if ( pdf_type == 1 ) : 
                                    tbl_cols = ['file_id','file_name','page','page_no','note_no','trading_date','client_id',
                                                'operating_fee','operating_fee_CD','registration_fee_BM_F','registration_fee_BM_F_CD','rate_BM_F','rate_BM_F_CD',
                                                'iss','iss_CD','total_expenses','total_expenses_CD','t_CV','t_merchandise','t_due_date','t_quantity','t_price_adjustment',
                                                't_business_type','t_operation_adjustment_val','t_DC','t_operating_fee']
                                    table_name = 'trade_data1_tmp'
                                else : 
                                    tbl_cols = ['file_id','file_name','page','page_no','note_no','trading_date','client_id',
                                                'settlement_fee','settlement_fee_CD','registration_fee','registration_fee_CD','fees','fees_CD',
                                                'clearing','clearing_CD','iss','iss_CD','IRRF_without_operations_base','IRRF_without_operations_base_CD',
                                                'others','others_CD','operations_value','operations_value_CD','t_Q','t_negotiation','t_CV','t_market_type','t_deadline',
                                                't_title_spec','t_note','t_quantity','t_price_adjustment','t_operation_adjustment_val','t_DC']
                                    table_name = 'trade_data2_tmp'

                                pg_no = parser_util.getPageNum(df_json['input'][0])

                                final_df = final_df.reindex(columns=tbl_cols)
                                db_connection.execute(text("DELETE FROM "+table_name+" WHERE file_id = "+file_id+" and page_no = "+pg_no))
                                final_df.to_sql(table_name, db_connection, if_exists='append', index=False)
                                logging.info('Prepare pdf data '+file_id+", "+pg_no)
                                if ( pdf_type == 2 ) : 
                                    db_connection.execute(text("UPDATE trade_data2_tmp a, (SELECT DISTINCT client_id, trading_date, settlement_fee, settlement_fee_CD, registration_fee, registration_fee_CD, fees, fees_CD, clearing, clearing_CD, iss, iss_CD, IRRF_without_operations_base, IRRF_without_operations_base_CD, others, others_CD, operations_value, operations_value_CD, (settlement_fee+registration_fee+fees+clearing+iss+IRRF_without_operations_base+others) as total_fees FROM trade_data2_tmp WHERE file_id = "+file_id+" HAVING total_fees != 0) b SET a.settlement_fee = b.settlement_fee, a.settlement_fee_CD = b.settlement_fee_CD, a.registration_fee = b.registration_fee, a.registration_fee_CD = b.registration_fee_CD, a.fees = b.fees, a.fees_CD = b.fees_CD, a.clearing = b.clearing, a.clearing_CD = b.clearing_CD, a.iss = b.iss, a.iss_CD = b.iss_CD, a.IRRF_without_operations_base = b.IRRF_without_operations_base, a.IRRF_without_operations_base_CD = b.IRRF_without_operations_base_CD, a.others = b.others, a.others_CD = b.others_CD, a.operations_value = b.operations_value, a.operations_value_CD = b.operations_value_CD WHERE a.file_id = "+file_id+" AND a.client_id = b.client_id AND a.trading_date = b.trading_date"))
                                else : 
                                    db_connection.execute(text("UPDATE trade_data1_tmp a, (SELECT DISTINCT client_id, trading_date, operating_fee, operating_fee_CD, registration_fee_BM_F, registration_fee_BM_F_CD, rate_BM_F, rate_BM_F_CD, iss, iss_CD, total_expenses, total_expenses_CD, (operating_fee+registration_fee_BM_F+rate_BM_F+iss+iss+total_expenses) as total_fees FROM trade_data1_tmp WHERE file_id = "+file_id+" HAVING total_fees != 0) b SET a.operating_fee = b.operating_fee, a.operating_fee_CD = b.operating_fee_CD, a.registration_fee_BM_F = b.registration_fee_BM_F, a.registration_fee_BM_F_CD = b.registration_fee_BM_F_CD, a.rate_BM_F = b.rate_BM_F, a.rate_BM_F_CD = b.rate_BM_F_CD, a.iss = b.iss, a.iss_CD = b.iss_CD, a.total_expenses = b.total_expenses, a.total_expenses_CD = b.total_expenses_CD WHERE a.file_id = "+file_id+" AND a.client_id = b.client_id AND a.trading_date = b.trading_date"))

                                logging.info('Updating pdf_files status to Processed(2)')
                                db_connection.execute(text("UPDATE pdf_files set process_status = 2, processed_datetime = current_timestamp(3) WHERE id = "+file_id))
                                
                                logging.info('Parsing successful!')

                            except ValueError as vx:
                                db_connection.execute(text("UPDATE pdf_files set process_status = 3, processed_datetime = current_timestamp(3), error_message = '"+str(vx)+"' WHERE id = "+file_id))
                                logging.info('ValueError ')
                                logging.info(vx)
                                tb = traceback.format_exc()
                            except Exception as ex:   
                                db_connection.execute(text("UPDATE pdf_files set process_status = 3, processed_datetime = current_timestamp(3), error_message = '"+str(ex)+"' WHERE id = "+file_id))
                                traceback.print_exc(file=sys.stdout)
                                logging.info('Exception >>')
                                logging.info(ex)
                                tb = traceback.format_exc()
                            else:
                                logging.info("File Data inserted to "+table_name)
                                tb = "No error"
                            
                            logging.info("Traceback error "+tb)
                    
                    if (files_success == 0): 
                        db_connection.execute(text("UPDATE pdf_files set process_status = 3, processed_datetime = current_timestamp(3), error_message = 'No parsed Data!' WHERE id = "+file_id))
        except Exception as ex: 
            db_connection.execute(text("UPDATE pdf_files set process_status = 3, processed_datetime = current_timestamp(3), error_message = '"+str(ex).replace("'",'')+"' WHERE id = "+file_id))
            traceback.print_exc(file=sys.stdout)
            logging.info('Exception >>')
            logging.info(ex)
            tb = traceback.format_exc()

except Exception as e : 
    db_connection.execute(text("UPDATE pdf_files set process_status = 3, processed_datetime = current_timestamp(3), error_message = '"+str(e).replace("'",'')+"'WHERE id = "+file_id))
    logging.info('Exception ')
    logging.info(e)
    tb = traceback.format_exc()
    traceback.print_exc(file=sys.stdout)

logging.info(tb)