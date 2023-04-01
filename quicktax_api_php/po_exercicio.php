<?php
include('mysql.php');

// echo '<pre>'; print_r($_REQUEST); echo '</pre>'; 
$req = $_REQUEST['req'];
if ( isset($_REQUEST['rid']) && isset($req) ) {


    $db = new db();
    $id = $_REQUEST['rid'];
    $client_id = $_REQUEST['cid'];
    $trade_date = $_REQUEST['tradeDate'];
    
    if ( $req == 'Po' ) { 

      $ticker = $_REQUEST['ticker'];
      $market_type = $_REQUEST['marketType'];
      $ap = $_REQUEST['ap'];
      $ap_total = $_REQUEST['apTotal'];


      $ins_qry = "INSERT INTO trade_data2(client_id, t_quantity, t_market_type, trading_date, t_title_spec, d_ticker, c_result, manual, processed) SELECT client_id, t_quantity, ? as market, ? as trading_date, ? as title, if(ticker_name is null, ?, ticker_name) as ticker, ? as result, 1, 1 FROM trade_data2 LEFT JOIN tickers ON REPLACE(REGEXP_REPLACE(?, ' EJ | ES | ED | EB | ER | EX | EC | EG ', ' '), '  ',' ')  = title_to_search WHERE id = ?";
      $ins_res = $db->query($ins_qry, $market_type, $trade_date, $ticker, $ticker, $ap_total, $ticker, $id);

      $qry = "DELETE FROM trade_data2 WHERE id = ?";
      $update = $db->query($qry, $id);

      $response['status'] = 'Success'; 

    } else if ( $req == 'Exercicio' ) { 

      $ticker = $_REQUEST['ticker'];
      $price = $_REQUEST['price'];
      $pdv = $_REQUEST['pdv'];
      $cv = $_REQUEST['transType'];

      
      $ins_qry = "INSERT INTO trade_data2(client_id, t_quantity, t_market_type, trading_date, t_title_spec, d_ticker, t_CV, t_price_adjustment, t_operation_adjustment_val, c_pdv, manual, processed) SELECT client_id, t_quantity, 'VISTA' as market_type, ? as trading_date, ? as title, if(ticker_name is null, ?, ticker_name) as ticker, ? as t_CV, ? as t_price_adjustment, (t_quantity*?) as opr_val, ? as c_pdv, 1, 0 FROM trade_data2 LEFT JOIN tickers ON REPLACE(REGEXP_REPLACE(?, ' EJ | ES | ED | EB | ER | EX | EC | EG ', ' '), '  ',' ')  = title_to_search WHERE id = ?";
      $ins_res = $db->query($ins_qry, $trade_date, $ticker, $ticker, $cv, $price, $price, $pdv, $ticker, $id);

      $qry = "DELETE FROM trade_data2 WHERE id = ?";
      $update = $db->query($qry, $id);

      $response['status'] = 'Success'; 

    } else if ( $req == 'Termo') { 

      $ticker = $_REQUEST['ticker'];
      $price = $_REQUEST['price'];
      // $pdv = $_REQUEST['pdv'];
      $cv = $_REQUEST['transType'];
      
      // With PDV=0
      $ins_qry = "INSERT INTO trade_data2(client_id, t_quantity, t_market_type, trading_date, t_title_spec, d_ticker, t_CV, t_price_adjustment, t_operation_adjustment_val, c_pdv, manual, processed) SELECT client_id, t_quantity, 'VISTA' as market_type, ? as trading_date, ? as title, if(ticker_name is null, ?, ticker_name) as ticker, ? as t_CV, ? as t_price_adjustment, (t_quantity*?) as opr_val, 0 as pdv, 1, 0 FROM trade_data2 LEFT JOIN tickers ON REPLACE(REGEXP_REPLACE(?, ' EJ | ES | ED | EB | ER | EX | EC | EG ', ' '), '  ',' ')  = title_to_search WHERE id = ?";
      $ins_res = $db->query($ins_qry, $trade_date, $ticker, $ticker, $cv, $price, $price, $ticker, $id);

      $qry = "DELETE FROM trade_data2 WHERE id = ?";
      $update = $db->query($qry, $id);

      $response['status'] = 'Success'; 

    } else { 
      $response['status'] = 'Failed';
    }
    $db->close();
} else { 
    $response['status'] = 'Failed';
    $response['message'] = 'Incomplete Request';
}
echo json_encode($response);
?>