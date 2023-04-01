import pandas
import re
from decimal import Decimal
from datetime import datetime
from pandas.io.json import json_normalize

def is_number(st) : 
    if ( st != '' ) : 
        st = str(st).strip()
        x = st.replace(',','').replace('$','').replace('sqft','').replace('.','').strip()
        return x.isnumeric()
    else : 
        return False

def getNumber(val):
     value = val.replace(',','').replace('$','')
     try:
        value = Decimal(value)
        return value
     except:
        return 0

def getPageNum(x) : 
    return x[x.rfind('_')+1:x.rfind('.xml')]

def formatCurrency(df, cols) : 
    # print('\n')
    # print(df)
    for colName in cols:
        if colName in list(df.columns) : 
            col = df[colName]
            if ( col.isnull().any() ) : 
                df[colName] = ''
            else : 
                # col = re.sub(".","",str(col))
                # col = re.sub("\,",".",col)
                # col = re.sub("'",".",col)
                # df[colName] = col
                # df[colName] = (col.strip() if is_number(col) else '')
                col = col.str.replace(".","")
                col = col.str.replace('\,', ".")
                col = col.str.replace("'",".")
                df[colName] = col.apply(lambda x: str(x).strip() if is_number(x) else '')
        else : 
            df[colName] = ''
    return df

def parseTable(pdf_type, table, table_headers, base_df, base_df_headers, logging) : 
    
    table_data_df = pandas.DataFrame(columns = base_df_headers+table_headers)
    valid_pdf = True
    for (columnName, columnData) in table.iteritems():
        # print(table)
        if valid_pdf == False : 
            break
        for data in columnData :
            # print('parseTable ')
            # print(data)
            if ( data == None ) : 
                data = ''
            # print(data)
            t = pandas.json_normalize(data)
            tt = t.transpose()
            if ( len(table_headers) != len(tt.columns) ) : 
                valid_pdf = False
                if ( logging == '' ):
                    print('>>>>>>> Invalid PDF page '+base_df['page'])
                else :
                    logging.info(base_df)
                    logging.info('>>>>>>> Invalid PDF page '+base_df['page'])
                break
            tt = tt[1:]
            tt.columns = table_headers
            tt_df = pandas.DataFrame(tt)
            tt_df = tt_df.reindex(columns=base_df_headers+list(tt_df.columns))
            tt_df[base_df_headers] = base_df[base_df_headers].values
            # table_data_df = table_data_df.append(tt_df)
            table_data_df = pandas.concat(table_data_df,tt_df)
    
    if ( pdf_type == 1 ) : 
        table_data_df = formatCurrency(table_data_df, ['t_quantity','t_price_adjustment','t_operation_adjustment_val','t_operating_fee'])
    else : 
        table_data_df = formatCurrency(table_data_df, ['t_quantity','t_price_adjustment','t_operation_adjustment_val'])

    return table_data_df

def parseMain(pdf_type, others, others_headers, base_df, base_df_headers, logging) : 
    if ( pdf_type == 1 ) : 
        colMap = {
            "operating_fee":"Taxa operacional",
            "registration_fee_BM_F":"Taxa registro BM&F",
            "rate_BM_F":"Taxas BM&F (emol+f.gar)",
            "iss":"I.S.S",
            "total_expenses":"Total das despesas",
            }
    else : 
        colMap = {
            "settlement_fee":"Taxa de liquidação",
            "registration_fee":"Taxa de Registro",
            "fees":"Emolumentos",
            "clearing":"Clearing||Taxa Operacional||Corretagem",
            "iss":"ISS||Impostos",
            "IRRF_without_operations_base": "I.R.R.F. s/ operações, base",
            "others":"Outras Bovespa||Outras||Outros",
            "operations_value":"Valor das operações"
            }
    final_df = getDataFrame4Columns(colMap, others)
    final_df = final_df.reindex(columns=base_df_headers+list(final_df.columns))
    final_df[base_df_headers] = base_df[base_df_headers].values

    final_df = fillCDColumns(final_df, list(colMap))
    final_df = formatCurrency(final_df, list(colMap))
    return final_df

def getDataFrame4Columns ( colMap, in_df) :
    in_df.columns = [s.strip() for s in list(in_df.columns)]
    in_df_cols = list(in_df.columns)
    f_df = pandas.DataFrame()
    for key in colMap: 
        val = colMap[key]
        col = ""
        if ( "||" in val ) : 
            valArr = val.split("||")
            for v in valArr : 
                if v in in_df_cols: 
                    col = v
                    break
        elif val in in_df_cols : 
            col = val
        else : 
            col = ""

        if ( col == '' ) :
            f_df[key] = ""
        else :
            f_df[key] = in_df[col]

    return f_df

def getCurrencyPart ( x , part) : 
    if x != '' and '|' in str(x) :
        return x.split('|')[part] 
    elif part == 0 : 
        return x 
    else :
        return ""

def formatDate ( x ) : 
    # fx = datetime.strftime(x, '%Y-%m-%d')
    fx = datetime.strftime(datetime.strptime(x, '%d/%m/%Y'), '%Y-%m-%d')
    return fx

def fillCDColumns(df, columns) : 
    for columnName in columns:
        df[columnName+"_CD"] = df[columnName].apply(lambda x: getCurrencyPart(x, 1))
        df[columnName] = df[columnName].apply(lambda x: getCurrencyPart(x,0))
    return df

def fixEOFIssue(file_name) : 
    EOF_MARKER = b'%%EOF'

    with open(file_name, 'rb') as f:
        contents = f.read()

    # check if EOF is somewhere else in the file
    if EOF_MARKER in contents:
        # we can remove the early %%EOF and put it at the end of the file
        contents = contents.replace(EOF_MARKER, b'')
        contents = contents + EOF_MARKER
    else:
        # Some files really don't have an EOF marker
        # In this case it helped to manually review the end of the file
        print(contents[-8:]) # see last characters at the end of the file
        # printed b'\n%%EO%E'
        contents = contents[:-6] + EOF_MARKER
    new_file_name = file_name.replace('.pdf', '') + '_fixed.pdf'
    print(new_file_name)
    with open(new_file_name,'wb') as f1:
        f1.write(contents)
    
    return new_file_name