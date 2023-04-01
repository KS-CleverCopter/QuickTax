<?php
include('mysql.php');
include('config.php');

if(isset($_FILES["fileToUpload"])) {
    $file_name = preg_replace("/[^a-z0-9\_\-\.]/i", '',$_FILES['fileToUpload']['name']);
    $file_size = $_FILES['fileToUpload']['size'];
    $file_tmp = $_FILES['fileToUpload']['tmp_name'];

    $target_dir = $_app['upload_dir'];
    $target_file = $target_dir . basename($file_name);
    $file_type = $_REQUEST['fileType'];
    
    $response['filename'] = $file_name;

    if( move_uploaded_file($file_tmp, $target_file) ) {
        $db = new db();
        $qry = "insert into pdf_files(pdf_filename, file_path, file_type, uploaded_date, process_status, confirm_status) values(?,?,?,current_timestamp(3),0,0)";
        $insert = $db->query($qry, $file_name, $target_file, $file_type);
        if($insert->affectedRows()){ 
            $response['status'] = 'Success'; 
        } 
        $db->close();
        
    } else {
        $response['status'] = 'Failed';
    }
} else { 
    $response['status'] = 'Failed';
}
echo json_encode($response);
?>