from cmath import isnan
import pandas
import traceback
import sys
import calendar
import sqlalchemy
from sqlalchemy import text

def get_third_friday(year, month) : 
    c = calendar.Calendar(firstweekday=calendar.SUNDAY)

    monthcal = c.monthdatescalendar(year,month)
    third_friday = [day for week in monthcal for day in week if \
                day.weekday() == calendar.FRIDAY and \
                day.month == month][2]
    return third_friday

def calc_ap_result_comm(df ) : 
    for i, row in df.iterrows():
        print('-----------------      '+str(row['id'])+"        -----------------")
        
        prev_id = row['prev_id']
        prev_row = df.loc[df['id'] == prev_id].squeeze()
        print((prev_id == None))
        print(prev_row)
        print(row)

        if ( prev_id == None or ( prev_id != None and isnan(prev_id))) : 
            print('prev id is null')
            prev_ap_tot_amt = 0
            prev_dom = ''
            prev_ap_tot_qnty = 0
            prev_ap = 0
        elif prev_row.empty : 
            print('prev row is null')
            prev_ap_tot_amt = row['prev_ap_tot_amt']
            prev_dom = row['prev_dom']
            prev_ap_tot_qnty = row['prev_ap_tot_qnty']
            prev_ap = row['prev_ap']
        else : 
            print('prev is NOT empty')
            prev_ap_tot_amt = float(prev_row['c_ap_total_amount'])
            prev_dom = prev_row['d_dominent']
            prev_ap_tot_qnty = int(prev_row['c_ap_total_quantity'])
            prev_ap = float(prev_row['c_ap'])
        print('Prev dom '+str(prev_dom)+", qnty "+str(prev_ap_tot_qnty)+", amt "+str(prev_ap_tot_amt)+", ap "+str(prev_ap)+", id "+str(prev_id))

        t_quantity = row['t_quantity']
        d_dominant = str(row['d_dominent'])
        c_ap_total_quantity = row['c_ap_total_quantity']
        t_cv = row['t_cv']
        c_result = None

        if (t_cv == d_dominant): 
            print('cv = dom ')
            c_ap_trans_amt = (row['t_operation_adjustment_val'] + row['c_pdv']) if t_cv == 'C' else (row['t_operation_adjustment_val'] - row['c_pdv'])
            
            if prev_dom != '' and d_dominant != None and prev_dom != None and d_dominant != prev_dom and t_quantity > prev_ap_tot_qnty : 
                print('if dom == prev dom and qnty ')
                c_ap = c_ap_trans_amt / t_quantity
                c_ap_total_amount = c_ap_total_quantity * c_ap
            else : 
                print('else (dom != prev dom and qnty > prev ap qnty)')
                c_ap_total_amount = float(prev_ap_tot_amt) + c_ap_trans_amt
                c_ap = c_ap_total_amount / c_ap_total_quantity if c_ap_total_quantity > 0 else 0 

            if ( d_dominant == '' or d_dominant == "None" or d_dominant == None) : 
                    c_result = None
            elif (d_dominant != prev_dom and prev_ap_tot_qnty > 0 ) : 
                print('if 11')
                c_res_contrary = c_ap * prev_ap_tot_qnty
                c_res_storage = prev_ap * prev_ap_tot_qnty
                if t_cv == 'C' :  
                    c_result = c_res_storage - c_res_contrary 
                else :
                    c_result = c_res_contrary - c_res_storage
            
        else : #if ( t_cv != d_dominant or (d_dominant != prev_dom and prev_ap_tot_qnty > 0) ): 
            print('cv != dom ') 
            c_ap_trans_amt = t_quantity * prev_ap

            if prev_dom != ''  and d_dominant != None and prev_dom != None and d_dominant != prev_dom and t_quantity > prev_ap_tot_qnty : 
                print('if 1')
                c_ap = c_ap_trans_amt / t_quantity
                c_ap_total_amount = c_ap_total_quantity * c_ap

                
                if ( d_dominant == '' or d_dominant == "None" or d_dominant == None) : 
                    c_result = None
                else : 
                    print('if 2')
                    c_res_contrary = c_ap * prev_ap_tot_qnty
                    c_res_storage = prev_ap * prev_ap_tot_qnty
                    if t_cv == 'C' :  
                        c_result = c_res_storage - c_res_contrary 
                    else :
                        c_result = c_res_contrary - c_res_storage

            else : 
                print('else 1')
                c_ap_total_amount = prev_ap * c_ap_total_quantity
                c_ap = c_ap_total_amount / c_ap_total_quantity if c_ap_total_quantity > 0 else 0 

                # if ( d_dominant == '' or d_dominant == "None" or d_dominant == None) : # included on 9th April 2022
                #     c_result = None
                # else : 
                c_res_ta = (row['t_operation_adjustment_val'] + row['c_pdv']) if t_cv == 'C' else (row['t_operation_adjustment_val'] - row['c_pdv'])
                if c_ap_total_quantity > 0 : 
                    c_res_ca = c_ap * t_quantity
                else : 
                    c_res_ca = prev_ap * t_quantity

                if ( d_dominant == 'V') :  # included on 6th April 
                    c_result = c_res_ca - c_res_ta
                else : 
                    c_result = c_res_ta - c_res_ca
    

        print("ap_trans_amt "+str(c_ap_trans_amt))
        print("ap_total_amt "+str(c_ap_total_amount))
        print('ap '+str(c_ap))
        print('prev_ap '+str(prev_ap))
        print('prev_ap_tot_amt '+str(prev_ap_tot_amt))
        print('c_result '+str(c_result))
        
        df.loc[i, 'c_ap_trans_amt'] = c_ap_trans_amt
        df.loc[i, 'c_ap'] = c_ap
        df.loc[i, 'c_ap_total_amount'] = c_ap_total_amount
        df.loc[i, 'prev_ap'] = prev_ap
        df.loc[i, 'prev_ap_tot_amt'] = prev_ap_tot_amt
        df.loc[i, 'c_result'] = c_result
    
    return df

def calc_ap_vista_manual(id, db_connection, logging) :
    try : 

        # update qry c_ap_total_quantity, c_total_c, c_total_v, d_dominant
        upd_qry1 = "UPDATE trade_data2 a, (WITH t AS (SELECT id, trading_date, client_id, d_ticker, d_market, (SELECT sum((CASE WHEN trim(t_cv)='C' then (t_quantity) else 0 end)) FROM trade_data2 AS b WHERE b.trading_date <= a.trading_date AND a.client_id = b.client_id AND a.d_ticker = b.d_ticker AND a.d_market = b.d_market AND (b.t_note IS NULL OR b.t_note NOT LIKE '%D%') AND b.id <= a.id) AS total_c, (SELECT sum((CASE WHEN trim(t_cv)='V' then (t_quantity) else 0 end)) FROM trade_data2 AS b WHERE b.trading_date <= a.trading_date AND a.client_id = b.client_id AND a.d_ticker = b.d_ticker AND a.d_market = b.d_market AND (b.t_note IS NULL OR b.t_note NOT LIKE '%D%') AND b.id <= a.id) AS total_v FROM trade_data2 AS a WHERE id = "+id+" AND d_market = 'VISTA_FRACIONARIO') SELECT id, trading_date, client_id, d_market, d_ticker, if((total_c-total_v)<0, -1*(total_c-total_v), total_c-total_v) as total_quant, total_v, total_c FROM t) b SET c_ap_total_quantity = total_quant, c_total_c = total_c, c_total_v = total_v, d_dominent = if(total_quant = 0, 'Z', if(total_c > total_v, 'C', 'V')) WHERE a.id = b.id and (a.t_note IS NULL OR a.t_note NOT LIKE '%D%')"

        db_connection.execute(text(upd_qry1))

        prev_upd_qry = "UPDATE trade_data2 a, (SELECT id, substring_index(pre, '|', 1) as prev_id, substring_index( substring_index(pre, '|',2),'|',-1) as prev_dom, substring_index(substring_index(pre, '|',3),'|',-1) as prev_ap_qnty, substring_index(substring_index(pre, '|',4),'|',-1) as prev_ap_amt, substring_index(pre, '|', -1) as prev_ap FROM (select id, file_id, (select concat(id, '|', d_dominent ,'|',if(c_ap_total_quantity is null,'',c_ap_total_quantity),'|',if(c_ap_total_amount is null,0,c_ap_total_amount),'|',if(c_ap is null,0,c_ap)) from trade_data2 b WHERE b.trading_date <= a.trading_date AND a.client_id = b.client_id AND a.d_ticker = b.d_ticker AND a.d_market = b.d_market AND (b.t_note IS NULL OR b.t_note NOT LIKE '%D%') AND b.id < a.id order by id desc limit 1) as pre from trade_data2 a WHERE id = "+id+"  AND d_market = 'VISTA_FRACIONARIO') x ) b SET a.prev_ap_tot_qnty = prev_ap_qnty, a.prev_dom = b.prev_dom, a.prev_id = b.prev_id, a.prev_ap = b.prev_ap, a.prev_ap_tot_amt = prev_ap_amt, a.d_dominent = IF(a.d_dominent = 'Z', b.prev_dom, a.d_dominent) WHERE a.id = b.id"

        db_connection.execute(text(prev_upd_qry))

        qry = "select id, client_id, d_market, d_ticker, trading_date, t_price_adjustment, t_operation_adjustment_val, c_pdv, t_quantity, c_ap_total_quantity, prev_ap_tot_qnty, t_cv, d_dominent, prev_dom, prev_ap_tot_amt, prev_ap, c_ap_trans_amt, c_ap_total_amount, c_ap, prev_id, c_result from trade_data2 a where id = "+id+" AND d_market = 'VISTA_FRACIONARIO' AND (t_note IS NULL OR t_note NOT LIKE '%D%') order by client_id, d_market, d_ticker, trading_date, id"

        qry_res = pandas.read_sql(sql=text(qry), con=db_connection)

        df = pandas.DataFrame(qry_res)
        df = calc_ap_result_comm(df)

        # df.to_csv('calc_df_'+file_id+'.csv')
        df.to_sql("trade_data2_calc_tmp", db_connection, if_exists='replace', index=False)
        calc_upd_qry = "UPDATE trade_data2 a, trade_data2_calc_tmp b \
            SET a.c_ap = b.c_ap, a.c_ap_trans_amt = b.c_ap_trans_amt, a.c_ap_total_amount = b.c_ap_total_amount, \
                a.prev_ap = b.prev_ap, a.prev_ap_tot_amt = b.prev_ap_tot_amt, a.c_result = b.c_result, processed = 1, processed_time = now() WHERE a.id = "+id+" AND a.id = b.id"
        # print(calc_upd_qry)
        db_connection.execute(text(calc_upd_qry))

        return "Done"

    except Exception as e : 
        logging.info('Exception ')
        logging.info(e)
        tb = traceback.format_exc()
        traceback.print_exc(file=sys.stdout)
        return e


def calc_ap_vista (file_id, db_connection, logging) :

    try : 
        # update qry c_ap_total_quantity, c_total_c, c_total_v, d_dominant
        upd_qry1 = "UPDATE trade_data2 a, (WITH t AS (SELECT id, trading_date, client_id, d_ticker, d_market, (SELECT sum((CASE WHEN trim(t_cv)='C' then (t_quantity) else 0 end)) FROM trade_data2 AS b WHERE b.trading_date <= a.trading_date AND a.client_id = b.client_id AND a.d_ticker = b.d_ticker AND a.d_market = b.d_market AND (b.t_note IS NULL OR b.t_note NOT LIKE '%D%') AND b.id <= a.id) AS total_c, (SELECT sum((CASE WHEN trim(t_cv)='V' then (t_quantity) else 0 end)) FROM trade_data2 AS b WHERE b.trading_date <= a.trading_date AND a.client_id = b.client_id AND a.d_ticker = b.d_ticker AND a.d_market = b.d_market AND (b.t_note IS NULL OR b.t_note NOT LIKE '%D%') AND b.id <= a.id) AS total_v FROM trade_data2 AS a WHERE file_id  = "+file_id+" AND d_market = 'VISTA_FRACIONARIO') SELECT id, trading_date, client_id, d_market, d_ticker, if((total_c-total_v)<0, -1*(total_c-total_v), total_c-total_v) as total_quant, total_v, total_c FROM t) b SET c_ap_total_quantity = total_quant, c_total_c = total_c, c_total_v = total_v, d_dominent = if(total_quant = 0, 'Z', if(total_c > total_v, 'C', 'V')) WHERE a.id = b.id and (a.t_note IS NULL OR a.t_note NOT LIKE '%D%')"
        db_connection.execute(text(upd_qry1))

        prev_upd_qry = "UPDATE trade_data2 a, (SELECT id, substring_index(pre, '|', 1) as prev_id, substring_index( substring_index(pre, '|',2),'|',-1) as prev_dom, substring_index(substring_index(pre, '|',3),'|',-1) as prev_ap_qnty, substring_index(substring_index(pre, '|',4),'|',-1) as prev_ap_amt, substring_index(pre, '|', -1) as prev_ap FROM (select id, file_id, (select concat(id, '|', d_dominent ,'|',if(c_ap_total_quantity is null,'',c_ap_total_quantity),'|',if(c_ap_total_amount is null,0,c_ap_total_amount),'|',if(c_ap is null,0,c_ap)) from trade_data2 b WHERE b.trading_date <= a.trading_date AND a.client_id = b.client_id AND a.d_ticker = b.d_ticker AND a.d_market = b.d_market AND (b.t_note IS NULL OR b.t_note NOT LIKE '%D%') AND b.id < a.id order by id desc limit 1) as pre from trade_data2 a WHERE file_id = "+file_id+"  AND d_market = 'VISTA_FRACIONARIO') x ) b SET a.prev_ap_tot_qnty = prev_ap_qnty, a.prev_dom = b.prev_dom, a.prev_id = b.prev_id, a.prev_ap = b.prev_ap, a.prev_ap_tot_amt = prev_ap_amt, a.d_dominent = IF(a.d_dominent = 'Z', b.prev_dom, a.d_dominent) WHERE a.id = b.id"
        db_connection.execute(text(prev_upd_qry))

        qry = "select id, client_id, d_market, d_ticker, trading_date, t_price_adjustment, t_operation_adjustment_val, c_pdv, t_quantity, c_ap_total_quantity, prev_ap_tot_qnty, t_cv, d_dominent, prev_dom, prev_ap_tot_amt, prev_ap, c_ap_trans_amt, c_ap_total_amount, c_ap, prev_id, c_result from trade_data2 a where file_id = "+file_id+" AND d_market = 'VISTA_FRACIONARIO' AND (t_note IS NULL OR t_note NOT LIKE '%D%') order by client_id, d_market, d_ticker, trading_date, id"

        qry_res = pandas.read_sql(sql=text(qry), con=db_connection)

        df = pandas.DataFrame(qry_res)
        df = calc_ap_result_comm(df)

        # df.to_csv('calc_df_'+file_id+'.csv')
        df.to_sql("trade_data2_calc_tmp", db_connection, if_exists='replace', index=False)
        calc_upd_qry = "UPDATE trade_data2 a, trade_data2_calc_tmp b \
            SET a.c_ap = b.c_ap, a.c_ap_trans_amt = b.c_ap_trans_amt, a.c_ap_total_amount = b.c_ap_total_amount, \
                a.prev_ap = b.prev_ap, a.prev_ap_tot_amt = b.prev_ap_tot_amt, a.c_result = b.c_result, processed = 1, processed_time = now() WHERE a.file_id = "+file_id+" AND a.id = b.id"
        print(calc_upd_qry)
        db_connection.execute(text(calc_upd_qry))

        return "Done"

    except Exception as e : 
        logging.info('Exception ')
        logging.info(e)
        tb = traceback.format_exc()
        traceback.print_exc(file=sys.stdout)
        return e


def calc_result_futuro (file_id, db_connection, logging) :

    try : 
        liq_qry = "UPDATE trade_data1 x, (select id, (select id from trade_data1 b WHERE b.trading_date <= a.trading_date AND a.client_id = b.client_id AND a.d_ticker = b.d_ticker AND (b.t_business_type = 'LIQUIDAÇÃO' OR (b.t_business_type = 'NORMAL' AND b.t_CV = 'V')) AND b.id < a.id order by id desc limit 1) as liq_id from trade_data1 a WHERE file_id = "+file_id+") y SET x.d_prev_liq_id = liq_id WHERE x.id = y.id AND (x.t_business_type = 'LIQUIDAÇÃO' OR (x.t_business_type = 'NORMAL' AND x.t_CV = 'V'))"
        db_connection.execute(text(liq_qry))

        upd_qry1 = "UPDATE trade_data1 a, (WITH t AS (SELECT id, trading_date, client_id, d_ticker, t_business_type, t_operation_adjustment_val, t_dc, d_prev_liq_id, (SELECT sum((CASE WHEN trim(t_DC)='C' then (t_operation_adjustment_val) else 0 end)) FROM trade_data1 AS b WHERE b.trading_date <= a.trading_date AND a.client_id = b.client_id AND a.d_ticker = b.d_ticker AND t_business_type in ('AJUPOS', 'NORMAL', 'TX. PERMANÊNCIA', 'LIQUIDAÇÃO') AND ((a.d_prev_liq_id is NOT NULL AND b.id > a.d_prev_liq_id AND b.id <= a.id) OR (a.d_prev_liq_id IS NULL AND b.id <= a.id) )) AS total_c, (SELECT sum((CASE WHEN trim(t_DC)='D' then (t_operation_adjustment_val) else 0 end)) FROM trade_data1 AS b WHERE b.trading_date <= a.trading_date AND a.client_id = b.client_id AND a.d_ticker = b.d_ticker AND t_business_type in ('AJUPOS', 'NORMAL', 'TX. PERMANÊNCIA', 'LIQUIDAÇÃO') AND ((a.d_prev_liq_id is NOT NULL AND b.id > a.d_prev_liq_id AND b.id <= a.id) OR (a.d_prev_liq_id IS NULL AND b.id <= a.id) )) AS total_d, (SELECT sum(c_pdv_total_fees) FROM trade_data1 AS b WHERE b.trading_date <= a.trading_date AND a.client_id = b.client_id AND a.d_ticker = b.d_ticker AND t_business_type in ('AJUPOS', 'NORMAL', 'TX. PERMANÊNCIA', 'LIQUIDAÇÃO') AND ((a.d_prev_liq_id is NOT NULL AND b.id > a.d_prev_liq_id AND b.id <= a.id) OR (a.d_prev_liq_id IS NULL AND b.id <= a.id) )) as sum_pdvtaxtot FROM trade_data1 AS a WHERE file_id = "+file_id+" AND (t_business_type = 'LIQUIDAÇÃO' OR (t_business_type = 'NORMAL' AND t_CV = 'V'))) SELECT id, client_id,  d_ticker, t_business_type, trading_date, d_prev_liq_id, t_operation_adjustment_val, t_dc, total_c, total_d, (total_c - total_d) as result, sum_pdvtaxtot FROM t) b SET c_total_c = total_c, c_total_d = total_d, c_result = result, c_sum_pdv_total_fees = sum_pdvtaxtot, c_result_after_pdv = (result - sum_pdvtaxtot), processed = 1, processed_time = now() WHERE a.id = b.id"
        db_connection.execute(text(upd_qry1))

    except Exception as e : 
        logging.info('Exception ')
        logging.info(e)
        tb = traceback.format_exc()
        traceback.print_exc(file=sys.stdout)
        return e

def calc_ap_compra_venda (file_id, db_connection, logging) :
    #2342409_NotaCorretagem.pdf
    # markets -  OPCAO DE COMPRA, OPCAO DE VENDA, EXERC OPC VENDA, EXERC OPC COMPRA

    try : 
      try : 
        friday_qry = "UPDATE trade_data2 a, (WITH fri AS (SELECT id, month_firstday(t_deadline) as firstday  from trade_data2 where file_id = "+file_id+" AND t_market_type in ('OPCAO DE COMPRA', 'OPCAO DE VENDA', 'EXERC OPC VENDA', 'EXERC OPC COMPRA') and t_deadline is not null) SELECT id, date_add(firstday, interval if(dayofweek(firstday) = 7, (13+dayofweek(firstday)), (20-dayofweek(firstday))) day) as 3rdfriday from fri) b SET a.d_3rdfriday = 3rdfriday WHERE a.id = b.id"
        db_connection.execute(text(friday_qry))
      except Exception as de : 
        logging.info('3rd friday Exception ')
        logging.info(de)

      # update qry c_ap_total_quantity, c_total_c, c_total_v, d_dominant
      upd_qry1 = "UPDATE trade_data2 a, (WITH t AS (SELECT id, trading_date, client_id, d_ticker, t_market_type, (SELECT sum((CASE WHEN trim(t_cv)='C' then (t_quantity) else 0 end)) FROM trade_data2 AS b WHERE b.trading_date <= a.trading_date AND a.client_id = b.client_id AND a.d_ticker = b.d_ticker AND a.t_market_type = b.t_market_type AND (b.t_note IS NULL OR b.t_note NOT LIKE '%D%') AND b.id <= a.id) AS total_c, (SELECT sum((CASE WHEN trim(t_cv)='V' then (t_quantity) else 0 end)) FROM trade_data2 AS b WHERE b.trading_date <= a.trading_date AND a.client_id = b.client_id AND a.d_ticker = b.d_ticker AND a.t_market_type = b.t_market_type AND (b.t_note IS NULL OR b.t_note NOT LIKE '%D%') AND b.id <= a.id) AS total_v FROM trade_data2 AS a WHERE file_id  = "+file_id+" AND t_market_type  in ('TERMO', 'OPCAO DE COMPRA', 'OPCAO DE VENDA','EXERC OPC VENDA', 'EXERC OPC COMPRA')) SELECT id, trading_date, client_id, t_market_type, d_ticker, if((total_c-total_v)<0, -1*(total_c-total_v), total_c-total_v) as total_quant, total_v, total_c FROM t) b SET c_ap_total_quantity = total_quant, c_total_c = total_c, c_total_v = total_v, d_dominent = if(total_quant = 0, 'Z', if(total_c > total_v, 'C', 'V')) WHERE a.id = b.id and (a.t_note IS NULL OR a.t_note NOT LIKE '%D%')"
      db_connection.execute(text(upd_qry1))

      prev_upd_qry = "UPDATE trade_data2 a, (SELECT id, substring_index(pre, '|', 1) as prev_id, substring_index( substring_index(pre, '|',2),'|',-1) as prev_dom, substring_index(substring_index(pre, '|',3),'|',-1) as prev_ap_qnty, substring_index(substring_index(pre, '|',4),'|',-1) as prev_ap_amt, substring_index(pre, '|', -1) as prev_ap FROM (select id, file_id, (select concat(id, '|', d_dominent ,'|',if(c_ap_total_quantity is null,'',c_ap_total_quantity),'|',if(c_ap_total_amount is null,0,c_ap_total_amount),'|',if(c_ap is null,0,c_ap)) from trade_data2 b WHERE b.trading_date <= a.trading_date AND a.client_id = b.client_id AND a.d_ticker = b.d_ticker AND a.t_market_type = b.t_market_type AND (b.t_note IS NULL OR b.t_note NOT LIKE '%D%') AND b.id < a.id order by id desc limit 1) as pre from trade_data2 a WHERE file_id = "+file_id+"  AND t_market_type  in ('TERMO', 'OPCAO DE COMPRA', 'OPCAO DE VENDA','EXERC OPC VENDA', 'EXERC OPC COMPRA')) x ) b SET a.prev_ap_tot_qnty = prev_ap_qnty, a.prev_dom = b.prev_dom, a.prev_id = b.prev_id, a.prev_ap = b.prev_ap, a.prev_ap_tot_amt = prev_ap_amt, a.d_dominent = IF(a.d_dominent = 'Z', b.prev_dom, a.d_dominent) WHERE a.id = b.id"
      db_connection.execute(text(prev_upd_qry))

      qry = "select id, client_id, t_market_type, d_ticker, trading_date, t_price_adjustment, t_operation_adjustment_val, c_pdv, t_quantity, c_ap_total_quantity, prev_ap_tot_qnty, t_cv, d_dominent, prev_dom, prev_ap_tot_amt, prev_ap, c_ap_trans_amt, c_ap_total_amount, c_ap, prev_id, c_result from trade_data2 a where file_id = "+file_id+" AND t_market_type  in ('TERMO', 'OPCAO DE COMPRA', 'OPCAO DE VENDA','EXERC OPC VENDA', 'EXERC OPC COMPRA') AND (t_note IS NULL OR t_note NOT LIKE '%D%') order by client_id, t_market_type, d_ticker, trading_date, id"

      qry_res = pandas.read_sql(sql=text(qry), con=db_connection)

      df = pandas.DataFrame(qry_res)
      df = calc_ap_result_comm(df)
      
      # df.to_csv('calc_df_'+file_id+'.csv')
      df.to_sql("trade_data2_calc1_tmp", db_connection, if_exists='replace', index=False)
      calc_upd_qry = "UPDATE trade_data2 a, trade_data2_calc1_tmp b \
          SET a.c_ap = b.c_ap, a.c_ap_trans_amt = b.c_ap_trans_amt, a.c_ap_total_amount = b.c_ap_total_amount, \
              a.prev_ap = b.prev_ap, a.prev_ap_tot_amt = b.prev_ap_tot_amt, a.c_result = b.c_result, processed = 1, processed_time = now() WHERE a.file_id = "+file_id+" AND a.id = b.id"
      print(calc_upd_qry)
      db_connection.execute(text(calc_upd_qry))

      return "Done"

    except Exception as e : 
        logging.info('Exception ')
        logging.info(e)
        tb = traceback.format_exc()
        traceback.print_exc(file=sys.stdout)
        return e

def calc_ap_compra_venda_manual (id, db_connection, logging) :
    #2342409_NotaCorretagem.pdf
    # markets -  OPCAO DE COMPRA, OPCAO DE VENDA, EXERC OPC VENDA, EXERC OPC COMPRA

    try : 
      try : 
        friday_qry = "UPDATE trade_data2 a, (WITH fri AS (SELECT id, month_firstday(t_deadline) as firstday  from trade_data2 where id = "+id+" AND t_market_type in ('TERMO', 'OPCAO DE COMPRA', 'OPCAO DE VENDA', 'EXERC OPC VENDA', 'EXERC OPC COMPRA') and t_deadline is not null) SELECT id, date_add(firstday, interval if(dayofweek(firstday) = 7, (13+dayofweek(firstday)), (20-dayofweek(firstday))) day) as 3rdfriday from fri) b SET a.d_3rdfriday = 3rdfriday WHERE a.id = b.id"
        db_connection.execute(text(friday_qry))
      except Exception as de : 
        logging.info('3rd friday Exception ')
        logging.info(e)

        # update qry c_ap_total_quantity, c_total_c, c_total_v, d_dominant
      upd_qry1 = "UPDATE trade_data2 a, (WITH t AS (SELECT id, trading_date, client_id, d_ticker, t_market_type, (SELECT sum((CASE WHEN trim(t_cv)='C' then (t_quantity) else 0 end)) FROM trade_data2 AS b WHERE b.trading_date <= a.trading_date AND a.client_id = b.client_id AND a.d_ticker = b.d_ticker AND a.t_market_type = b.t_market_type AND (b.t_note IS NULL OR b.t_note NOT LIKE '%D%') AND b.id <= a.id) AS total_c, (SELECT sum((CASE WHEN trim(t_cv)='V' then (t_quantity) else 0 end)) FROM trade_data2 AS b WHERE b.trading_date <= a.trading_date AND a.client_id = b.client_id AND a.d_ticker = b.d_ticker AND a.t_market_type = b.t_market_type AND (b.t_note IS NULL OR b.t_note NOT LIKE '%D%') AND b.id <= a.id) AS total_v FROM trade_data2 AS a WHERE id  = "+id+" AND t_market_type  in ('TERMO', 'OPCAO DE COMPRA', 'OPCAO DE VENDA','EXERC OPC VENDA', 'EXERC OPC COMPRA')) SELECT id, trading_date, client_id, t_market_type, d_ticker, if((total_c-total_v)<0, -1*(total_c-total_v), total_c-total_v) as total_quant, total_v, total_c FROM t) b SET c_ap_total_quantity = total_quant, c_total_c = total_c, c_total_v = total_v, d_dominent = if(total_quant = 0, 'Z', if(total_c > total_v, 'C', 'V')) WHERE a.id = b.id and (a.t_note IS NULL OR a.t_note NOT LIKE '%D%')"
      print(upd_qry1)
      db_connection.execute(text(upd_qry1))

      prev_upd_qry = "UPDATE trade_data2 a, (SELECT id, substring_index(pre, '|', 1) as prev_id, substring_index( substring_index(pre, '|',2),'|',-1) as prev_dom, substring_index(substring_index(pre, '|',3),'|',-1) as prev_ap_qnty, substring_index(substring_index(pre, '|',4),'|',-1) as prev_ap_amt, substring_index(pre, '|', -1) as prev_ap FROM (select id, file_id, (select concat(id, '|', d_dominent ,'|',if(c_ap_total_quantity is null,'',c_ap_total_quantity),'|',if(c_ap_total_amount is null,0,c_ap_total_amount),'|',if(c_ap is null,0,c_ap)) from trade_data2 b WHERE b.trading_date <= a.trading_date AND a.client_id = b.client_id AND a.d_ticker = b.d_ticker AND a.t_market_type = b.t_market_type AND (b.t_note IS NULL OR b.t_note NOT LIKE '%D%') AND b.id < a.id order by id desc limit 1) as pre from trade_data2 a WHERE id = "+id+"  AND t_market_type  in ('TERMO', 'OPCAO DE COMPRA', 'OPCAO DE VENDA','EXERC OPC VENDA', 'EXERC OPC COMPRA')) x ) b SET a.prev_ap_tot_qnty = prev_ap_qnty, a.prev_dom = b.prev_dom, a.prev_id = b.prev_id, a.prev_ap = b.prev_ap, a.prev_ap_tot_amt = prev_ap_amt, a.d_dominent = IF(a.d_dominent = 'Z', b.prev_dom, a.d_dominent) WHERE a.id = b.id"
      print(prev_upd_qry)
      db_connection.execute(text(prev_upd_qry))

      qry = "select id, client_id, t_market_type, d_ticker, trading_date, t_price_adjustment, t_operation_adjustment_val, c_pdv, t_quantity, c_ap_total_quantity, prev_ap_tot_qnty, t_cv, d_dominent, prev_dom, prev_ap_tot_amt, prev_ap, c_ap_trans_amt, c_ap_total_amount, c_ap, prev_id, c_result from trade_data2 a where id = "+id+" AND t_market_type  in ('TERMO', 'OPCAO DE COMPRA', 'OPCAO DE VENDA','EXERC OPC VENDA', 'EXERC OPC COMPRA') AND (t_note IS NULL OR t_note NOT LIKE '%D%') order by client_id, t_market_type, d_ticker, trading_date, id"
      print(qry)

      qry_res = pandas.read_sql(sql=text(qry), con=db_connection)
      print(qry_res)

      df = pandas.DataFrame(qry_res)
      print(df)
      df = calc_ap_result_comm(df)
      
      # df.to_csv('calc_df_'+file_id+'.csv')
      df.to_sql("trade_data2_calc1_tmp", db_connection, if_exists='replace', index=False)
      calc_upd_qry = "UPDATE trade_data2 a, trade_data2_calc1_tmp b \
          SET a.c_ap = b.c_ap, a.c_ap_trans_amt = b.c_ap_trans_amt, a.c_ap_total_amount = b.c_ap_total_amount, \
              a.prev_ap = b.prev_ap, a.prev_ap_tot_amt = b.prev_ap_tot_amt, a.c_result = b.c_result, processed = 1, processed_time = now() WHERE a.id = "+id+" AND a.id = b.id"
      print(calc_upd_qry)
      db_connection.execute(text(calc_upd_qry))

      return "Done"

    except Exception as e : 
        logging.info('Exception ')
        logging.info(e)
        tb = traceback.format_exc()
        traceback.print_exc(file=sys.stdout)
        return e