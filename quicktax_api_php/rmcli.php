<?php
include('mysql.php');

if(isset($_REQUEST["cid"])) {
    $cid = $_REQUEST['cid'];

    $db = new db();
    $qry = "call delete_client(?)";
    $delete = $db->query($qry, $cid);
    $affected_rows = $delete->affectedRows();
    $response['status'] = 'Success';
    $response['affected_rows'] = $affected_rows;
    $db->close();

} else { 
  $response['status'] = 'Failed';
  $response['message'] = 'Incomplete Request';
}
echo json_encode($response);
?>