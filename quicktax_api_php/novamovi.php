<?php
include('mysql.php');

// echo '<pre>'; print_r($_REQUEST); echo '</pre>'; 
if ( isset($_REQUEST['client_id']) && isset($_REQUEST['trans_type']) ) {

    $db = new db();
    
    $m_client_id = $_REQUEST['client_id'];
    $m_username = $_REQUEST['username'];
    $m_trans_type = $_REQUEST['trans_type'];
    $m_cv = $_REQUEST['cv'];
    $m_dc = $_REQUEST['dc'];
    $m_day_trade = ($_REQUEST['dayTrade']==='false'?'':'D');
    $m_ticker = $_REQUEST['ticker'];
    $m_quantity = trim($_REQUEST['qnty'])!=''?$_REQUEST['qnty']:null;
    $m_price= trim($_REQUEST['prece'])!=''?$_REQUEST['prece']:null;
    $m_opr_adj = trim($_REQUEST['op_adj'])!=''?$_REQUEST['op_adj']:null;
    $m_pdv = trim($_REQUEST['rateio'])!=''?$_REQUEST['rateio']:null;
    $m_irrf = trim($_REQUEST['irrf'])!=''?$_REQUEST['irrf']:null;
    $m_note_no = trim($_REQUEST['nota_no'])!=''?$_REQUEST['nota_no']:null;
    $m_trade_date = trim($_REQUEST['tdate'])!=''?$_REQUEST['tdate']:null;
    $m_deadline = trim($_REQUEST['deadline'])!=''?$_REQUEST['deadline']:null;
    
    $cli_qry = "INSERT IGNORE INTO client_info(client_id, client_name) VALUES(?,?) ON DUPLICATE KEY UPDATE client_name = ?";
    $cli_insert = $db->query($cli_qry, $m_client_id, $m_username, $m_username);

    $qry = "INSERT INTO novamovi_form(m_client_id, m_username, m_trans_type, m_compra_cv, m_dc, m_day_trade, m_ticker, m_quantity,
    m_price_adjustment, m_operation_adjustment, m_pdv_rateio, m_irrf, m_note_no, m_trade_date, m_deadline) 
    values(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

    $insert = $db->query($qry, $m_client_id, $m_username, $m_trans_type, $m_cv, $m_dc, $m_day_trade, $m_ticker, $m_quantity, 
    $m_price, $m_opr_adj, $m_pdv, $m_irrf, $m_note_no, $m_trade_date, $m_deadline);

    if($insert->affectedRows()){ 

        if ( in_array($m_trans_type, array('LUCRO', 'PREJUIZO')) ) { 
            $trade_data_qry = "INSERT INTO trade_data2(note_no, trading_date, client_id, IRRF_without_operations_base, t_CV, t_market_type, t_deadline, 
            t_title_spec, t_note, t_quantity, t_price_adjustment, t_operation_adjustment_val, t_DC, c_pdv, c_result, manual, processed, IRRF_without_operations_base_CD, trading_date_month) 
            values(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,0,'',DATE_FORMAT(?, '%M/%Y'))";
            $trade_data_insert = $db->query($trade_data_qry, $m_note_no, $m_trade_date, $m_client_id, $m_irrf, $m_cv, $m_trans_type, 
            $m_deadline, $m_ticker, $m_day_trade, $m_quantity, $m_price, $m_opr_adj, $m_dc, $m_pdv, $m_opr_adj, $m_trade_date);
        } else { 
            $trade_data_qry = "INSERT INTO trade_data2(note_no, trading_date, client_id, IRRF_without_operations_base, t_CV, t_market_type, t_deadline, 
            t_title_spec, t_note, t_quantity, t_price_adjustment, t_operation_adjustment_val, t_DC, c_pdv, manual, processed, IRRF_without_operations_base_CD, trading_date_month) 
            values(?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,0,'',DATE_FORMAT(?, '%M/%Y'))";
            $trade_data_insert = $db->query($trade_data_qry, $m_note_no, $m_trade_date, $m_client_id, $m_irrf, $m_cv, $m_trans_type, 
            $m_deadline, $m_ticker, $m_day_trade, $m_quantity, $m_price, $m_opr_adj, $m_dc, $m_pdv,$m_trade_date);
        }
        $upd_ticker = "UPDATE trade_data2 LEFT JOIN tickers b ON REPLACE(REGEXP_REPLACE(t_title_spec, ' EJ | ES | ED | EB | ER | EX | EC | EG ', ' '), '  ',' ')  = title_to_search SET d_ticker = IF(ticker_name IS NULL, t_title_spec, ticker_name) WHERE d_ticker is null";
        $update_ticker = $db->query($upd_ticker);
    
        if ( $trade_data_insert->affectedRows() ) { 
            $response['status'] = 'Success'; 
        }
    } 
    $db->close();
} else { 
    $response['status'] = 'Failed';
    $response['message'] = 'Incomplete Request';
}
echo json_encode($response);
?>