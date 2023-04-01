<?php
include('mysql.php');

if(isset($_REQUEST['ticker'])) {
    $split = $_REQUEST['split'];
    $ticker = $_REQUEST['ticker'];
    $mult = $_REQUEST['mult'];
    $date = $_REQUEST['tradeDate'];
    
    $db = new db();
    $qry = "insert into split_inplit(split_inplit, ticker, multiplicador, trans_date) values(?,?,?,?)";
    $insert = $db->query($qry, $split, $ticker, $mult, $date);
    if($insert->affectedRows()){ 
      if ( $split == 'split' ) { 
        $upd_qry = "UPDATE trade_data2 SET t_quantity = (t_quantity * ?), t_operation_adjustment_val = (t_price_adjustment * t_quantity * ?), processed = 0 WHERE (t_title_spec = ? OR d_ticker = ?) AND trading_date < ?";
      } else { 
        $upd_qry = "UPDATE trade_data2 SET t_quantity = round(t_quantity / ?), t_operation_adjustment_val = (t_price_adjustment * round(t_quantity / ?)), processed = 0 WHERE (t_title_spec = ? OR d_ticker = ?) AND trading_date < ?";
      }
      
      $upd_res = $db->query($upd_qry, $mult, $mult, $ticker, $ticker, $date);
      $response['status'] = 'Success'; 
    } 
    $db->close();
      
} else { 
    $response['status'] = 'Failed';
}
echo json_encode($response);
?>