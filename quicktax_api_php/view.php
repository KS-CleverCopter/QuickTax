<?php
include('mysql.php');
include('config.php');

$res_json = [];

// $fp = fopen($_app['htdocs_base'].'/app.log','a+');

if ( !isset($_REQUEST['req']) ) { 
    $res_json['status'] = 'Failed';
    $res_json['message'] = 'Invalid Request';
} else { 
    $db = new db();
    $req_name = $_REQUEST['req'];
    if ( $req_name == 'cname' ) { 
        $qry = "SELECT client_name FROM client_info WHERE client_id = '".$_REQUEST['cid']."'";
    } else if ( $req_name == 'clnts' ) { 
        // $qry = "SELECT group_concat('{value:\"',client_id,'\",label:\"',client_name,'\"}') as clnts FROM client_info";
        $qry = 'SELECT concat("{",group_concat(\'"\',client_id, \'":"\', client_name,\'"\'),"}") as clnts FROM client_info';
    } else if ( $req_name == 'type2' ) { 
        $qry = "SELECT id, file_name as 'File',page_no as 'PageNo',note_no as 'NoteNo', t.trading_date as 'TradingDate', t.client_id as 'Client',concat(t.settlement_fee,' ',t.settlement_fee_CD) as '".$COLMAP['settlement_fee']."',concat(t.registration_fee, ' ', t.registration_fee_CD) as '".$COLMAP['registration_fee']."',concat(t.fees,' ',t.fees_cd) as '".$COLMAP['fees']."',concat(t.clearing,' ',t.clearing_cd) as '".$COLMAP['clearing']."',concat(t.iss,' ',t.iss_cd) as '".$COLMAP['iss']."',concat(t.IRRF_without_operations_base, ' ',t.IRRF_without_operations_base_CD) as '".$COLMAP['IRRF_without_operations_base']."', concat(t.others, ' ',t.others_CD) as '".$COLMAP['others']."', concat(t.operations_value,' ',t.operations_value_CD) as '".$COLMAP['operations_value']."',t_Q as '".$COLMAP['t_Q']."',t_negotiation as '".$COLMAP['t_negotiation']."',t_CV as '".$COLMAP['t_CV']."',t.t_market_type as '".$COLMAP['t_market_type']."',t_deadline as '".$COLMAP['t_deadline']."',t_title_spec as '".$COLMAP['t_title_spec']."',d_ticker as '".$COLMAP['d_ticker']."',t_note as '".$COLMAP['t_note']."',t_quantity as '".$COLMAP['t_quantity']."',t_price_adjustment as '".$COLMAP['t_price_adjustment']."',t_operation_adjustment_val as'".$COLMAP['t_operation_adjustment_val']."',t_DC as '".$COLMAP['t_DC']."', c_pdv_total_amount as '".$COLMAP['pdv_total_amount']."', c_pdv_total_fees as '".$COLMAP['pdv_total_fees']."', c_pdv as '".$COLMAP['pdv']."', c_ap_total_amount as '".$COLMAP['ap_total_amount']."', c_ap_total_quantity as '".$COLMAP['ap_total_quant']."', c_ap as '".$COLMAP['avg_price']."', d_dominent as 'DomiTrans', round(c_result,4) as 'Result', d_3rdfriday as 'ThirdFriday' from trade_data2 t ORDER BY trading_date, id";
        
    } else if ( $req_name == 'type1' ) { 
        $qry = "SELECT id, file_name as 'File',page_no as 'PageNo',note_no as 'NoteNo',trading_date as 'Trading Date',client_id as 'Client',concat(operating_fee,' ',operating_fee_CD) as '".$COLMAP['operating_fee']."',concat(registration_fee_BM_F, ' ',registration_fee_BM_F_CD) as '".$COLMAP['registration_fee_BM_F']."',concat(rate_BM_F, ' ', rate_BM_F_CD) as '".$COLMAP['rate_BM_F']."',concat(iss, ' ',iss_CD) as '".$COLMAP['iss']."',concat(total_expenses, ' ', total_expenses_CD) as '".$COLMAP['total_expenses']."',t_CV as '".$COLMAP['t_CV']."',t_merchandise as '".$COLMAP['t_merchandise']."',d_ticker as '".$COLMAP['d_ticker']."' ,t_due_date as '".$COLMAP['t_due_date']."',t_quantity as '".$COLMAP['t_quantity']."',t_price_adjustment as '".$COLMAP['t_price_adjustment']."',t_business_type as '".$COLMAP['t_business_type']."',t_operation_adjustment_val as '".$COLMAP['t_operation_adjustment_val']."',t_DC as '".$COLMAP['t_DC']."',t_operating_fee as '".$COLMAP['t_operating_fee']."', c_pdv_total_amount as '".$COLMAP['pdv_total_amount']."', c_pdv_total_fees as '".$COLMAP['pdv_total_fees']."', c_pdv as '".$COLMAP['pdv']."', round(c_total_c,2) as 'Positive', round(c_total_d,2) as 'Negative', round(c_result,2) as 'Result', round(c_sum_pdv_total_fees,2) as 'Sum_".$COLMAP['pdv_total_fees']."', round(c_result_after_pdv,2) as 'ResultAfterPDV' FROM trade_data1";

    } else if ( $req_name == 'nova_movi' ) { 
        $qry = "select id, m_client_id as 'CPF', m_username as 'Nome', m_trans_type as 'Tipo de movimentação', m_compra_cv as 'Compra / venda', m_dc as 'D/C', m_day_trade as 'Day-Trade', m_ticker as 'Ticker do ativo', m_quantity as 'Quantidade de ações', m_price_adjustment as 'Preço/Ajuste', m_operation_adjustment as 'Valor de Op/Ajuste', m_pdv_rateio as 'Rateio', m_irrf as 'I.R.R.F', m_note_no as 'Número da nota', m_trade_date as 'Data Pregão', m_deadline as 'Prazo', insert_time from novamovi_form";

    } else if ( $req_name == 'frm_poexercicio' ) { 
        $qry = "select id, d_ticker as 'Ativo', d_dominent as 'Letra Dominante', ROUND(c_ap,4) as 'Preço médio', t_price_adjustment as 'price', t_quantity as 'Quantidade',ROUND(c_ap_total_amount,4) as 'Montante total', t_market_type as 'Tipo de mercado', date_format(trading_date,'%Y-%m-%d') as 'Data', 'PO/Ex' as 'Ações', processed from trade_data2 where client_id = '".$_REQUEST['cid']."' AND t_market_type in ('OPCAO DE COMPRA','OPCAO DE VENDA','EXERC OPC VENDA', 'EXERC OPC COMPRA') AND (t_note IS NULL OR t_note NOT LIKE '%D%') AND (c_ap IS NULL OR c_ap != 0) AND c_result IS NULL ORDER BY id";

    } else if ( $req_name == 'frm_termo' ) { 
      $qry = "select id, d_ticker as 'Ativo', d_dominent as 'Letra Dominante', ROUND(c_ap,4) as 'Preço médio', t_price_adjustment as 'price', t_quantity as 'Quantidade',ROUND(c_ap_total_amount,4) as 'Montante total', t_deadline as 'Prazo', date_format(trading_date,'%Y-%m-%d') as 'Data', 'Exercicio' as 'Ações', processed from trade_data2 where client_id = '".$_REQUEST['cid']."' AND t_market_type = 'TERMO' AND (t_note IS NULL OR t_note NOT LIKE '%D%') ORDER BY id";
      
    } else if ( $req_name == 'dt' ) { 
      $qry = "select d_ticker as 'Ticker', t_cv as 'Letra Dominante', ROUND(t_price_adjustment,4) as 'Preço médio', t_quantity as 'Quantidade',ROUND(t_operation_adjustment_val,4) as 'Montante total', date_format(trading_date,'%Y-%m-%d') as 'Data' from trade_data2 where client_id = '".$_REQUEST['cid']."' AND t_note like '%D%' ORDER BY id";
      
    } else if ( $req_name == 'split' ) { 
      $qry = "SELECT ticker as 'Ticker', split_inplit as 'Inplit_Split', multiplicador as 'Multiplicador', trans_date as 'Data' FROM split_inplit ORDER BY insert_time desc";

    } else if ( $req_name == 'pdf_status' ) { 
        $qry = "select id as 'FileId', pdf_filename as 'FileName', (case file_type when 'safra' then 'Safra / BTG' else 'Normal' end) as 'File Type', uploaded_date as 'UploadedOn', (case process_status when 0 then 'Yet to Process' when 1 then 'In Progress' when 2 then 'Parsing done' when 3 then 'Error' end) as 'ParsingStatus', (case confirm_status when 0 then 'Yet To Confirm' when 1 then 'Confirmed' when 3 then 'Error' end) as 'ConfirmStatus', (case calc_status when 0 then 'Yet To Calculate' when 1 then 'InProgress' when 2 then 'Calculated' when 3 then 'Error' end) as 'CalcStatus' from pdf_files order by id desc";

    } else if ( $req_name == 'pdf_confirm') { 
        
        $file_id = $_REQUEST['fid'];

        $chk_qry = "select distinct b.file_name from (select distinct file_name, t_title_spec, trading_date from trade_data2_tmp where file_id = $file_id) a, (select distinct file_name, t_title_spec, trading_date from trade_data2_tmp where file_id != $file_id) b where a.t_title_spec = b.t_title_spec and b.trading_date < a.trading_date";
        $chk_qry1 = "select distinct b.file_name from (select distinct file_name, t_merchandise, trading_date from trade_data1_tmp where file_id = $file_id) a, (select distinct file_name, t_merchandise, trading_date from trade_data1_tmp where file_id != $file_id) b where a.t_merchandise = b.t_merchandise and b.trading_date < a.trading_date";

        $qry = "SELECT file_name as 'File',page_no as 'PageNo',note_no as 'NoteNo',trading_date as 'TradingDate',client_id as 'Client',concat(settlement_fee,' ',settlement_fee_CD) as '".$COLMAP['settlement_fee']."',concat(registration_fee, ' ', registration_fee_CD) as '".$COLMAP['registration_fee']."',concat(fees,' ',fees_cd) as '".$COLMAP['fees']."',concat(clearing,' ',clearing_cd) as '".$COLMAP['clearing']."',concat(iss,' ',iss_cd) as '".$COLMAP['iss']."',concat(IRRF_without_operations_base, ' ',IRRF_without_operations_base_CD) as '".$COLMAP['IRRF_without_operations_base']."', concat(others, ' ',others_CD) as '".$COLMAP['others']."', concat(operations_value,' ',operations_value_CD) as '".$COLMAP['operations_value']."',t_Q as '".$COLMAP['t_Q']."',t_negotiation as '".$COLMAP['t_negotiation']."',t_CV as '".$COLMAP['t_CV']."',t_market_type as '".$COLMAP['t_market_type']."',t_deadline as '".$COLMAP['t_deadline']."',t_title_spec as '".$COLMAP['t_title_spec']."',t_note as '".$COLMAP['t_note']."',t_quantity as '".$COLMAP['t_quantity']."',t_price_adjustment as '".$COLMAP['t_price_adjustment']."',t_operation_adjustment_val as'".$COLMAP['t_operation_adjustment_val']."',t_DC as '".$COLMAP['t_DC']."' FROM trade_data2_tmp WHERE file_id = ".$file_id;

        $qry1 = "SELECT file_name as 'File',page_no as 'PageNo',note_no as 'NoteNo',trading_date as 'Trading Date',client_id as 'Client',concat(operating_fee,' ',operating_fee_CD) as '".$COLMAP['operating_fee']."',concat(registration_fee_BM_F, ' ',registration_fee_BM_F_CD) as '".$COLMAP['registration_fee_BM_F']."',concat(rate_BM_F, ' ', rate_BM_F_CD) as '".$COLMAP['rate_BM_F']."',concat(iss, ' ',iss_CD) as '".$COLMAP['iss']."',concat(total_expenses, ' ', total_expenses_CD) as '".$COLMAP['total_expenses']."',t_CV as '".$COLMAP['t_CV']."',t_merchandise as '".$COLMAP['t_merchandise']."',t_due_date as '".$COLMAP['t_due_date']."',t_quantity as '".$COLMAP['t_quantity']."',t_price_adjustment as '".$COLMAP['t_price_adjustment']."',t_business_type as '".$COLMAP['t_business_type']."',t_operation_adjustment_val as '".$COLMAP['t_operation_adjustment_val']."',t_DC as '".$COLMAP['t_DC']."',t_operating_fee as '".$COLMAP['t_operating_fee']."' FROM trade_data1_tmp WHERE file_id = ".$file_id;

    } else if ( $req_name == 'auth' ) { 
        $uname = $_REQUEST['uname'];
        $pwd = $_REQUEST['pwd'];
        $qry = "select count(1) as auth from adminuser where username = '".$uname."' and pwd = md5('".$pwd."')";
    } else if ( $req_name == 'd5' ) {
        $qry = 'select trading_date as bd, d_ticker as tick, t_quantity as qtd, t_price_adjustment as price_me, c_ap_total_amount as mv_comp, trading_date as sd, t_price_adjustment as price_v, c_ap_total_amount as mv_tot, prev_ap_tot_amt as mv_ven, t_negotiation taxa_nego, settlement_fee as taxa_liq, registration_fee as taxa_reg, operations_value as cor_comp, operations_value as cor_ven, others as out_desp, c_result from trade_data2';
    }else { 
        $res_json['status'] = 'Failed';
        $res_json['message'] = 'Invalid Request';
    }

    if ( isset($qry) ) { 
        $max_cost = 0;

        if ( isset($chk_qry) ) { 
            $db_chk_qry = $db->query($chk_qry);
            $db_chk_res = $db_chk_qry->fetchAll();
            $res_json['warning'] = $db_chk_res;

            $db_chk_qry1 = $db->query($chk_qry1);
            $db_chk_res1 = $db_chk_qry1->fetchAll();
            $res_json['warning1'] = $db_chk_res1;
        }

        if ( isset($qry1) ) { 
            $db_qry1 = $db->query($qry1);
            $db_res1 = $db_qry1->fetchAll();
            $res_json['data1'] = $db_res1;
        }
        
        $db_qry = $db->query($qry);
        $db_res = $db_qry->fetchAll();
        $res_json['data'] =  $db_res;

        $res_json['status'] = 'Success';
        $db->close();
    }
}
// if ( $fp ) { 
//     fclose($fp);
// }
echo json_encode($res_json);
?>