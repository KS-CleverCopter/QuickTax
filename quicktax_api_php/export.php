<?php

include('mysql.php');
include('config.php');

function array2csv(array &$array)
{
   if (count($array) == 0) {
     return null;
   }
   ob_start();
   $df = fopen("php://output", 'w');
   fputcsv($df, array_keys(reset($array)));
   foreach ($array as $row) {
      fputcsv($df, $row);
   }
   fclose($df);
   return ob_get_clean();
}

function download_send_headers($filename) {
  // disable caching
  $now = gmdate("D, d M Y H:i:s");
  header("Expires: Tue, 03 Jul 2001 06:00:00 GMT");
  header("Cache-Control: max-age=0, no-cache, must-revalidate, proxy-revalidate");
  header("Last-Modified: {$now} GMT");

  // force download  
  header("Content-Type: application/force-download");
  header("Content-Type: application/octet-stream");
  header("Content-Type: application/download");

  // disposition / encoding on response body
  header("Content-Disposition: attachment;filename={$filename}");
  header("Content-Transfer-Encoding: binary");
}

// echo '<pre>'; print_r($_REQUEST); echo '<pre>';
if(isset($_REQUEST["cid"])) {
    $cid = $_REQUEST['cid'];
    $allMon = $_REQUEST['allMon'];
    if ( $allMon == 1 ) { 
        $allMon = "all";
        $monYr = 'all';
    } else { 
        $monYr = $_REQUEST['monYr'];
        $allMon = $monYr;
    }

    $fname = $cid."_".$allMon."_".time().".xlsx";
    $cmdStr = $_app['htdocs_base']."/export.py $cid $allMon $monYr $fname";
    exec($cmdStr, $output, $status);
    sleep(10);
    $response['status'] = "Success";
    $response['message'] = $_app['app_url']."files_exp/".$fname;
    echo json_encode($response);
    exit;
}
?>