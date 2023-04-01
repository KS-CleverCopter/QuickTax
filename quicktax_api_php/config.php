<?php
header("Access-Control-Allow-Origin: http://43.205.64.114:3000");
$server_ip = '43.205.64.114';

$_app['htdocs_base'] = getcwd();
$_app['upload_dir'] = getcwd()."/uploads/";
$_app['app_url'] = "http://$server_ip/quicktax/";

$COLMAP = array(
    "t_CV" => "CV",
    "t_merchandise" => "Mercadoria",
    "t_due_date" => "Vencimento",
    "t_quantity" => "Quantidade",
    "t_price_adjustment" => "Preço_Ajuste",
    "t_business_type" => "Tipo Negócio",
    "t_operation_adjustment_val" => "Vlr de Operação_Ajuste",
    "t_DC" => "D/C",
    "t_operating_fee" => "Taxa Operacional",
    "t_Q" => "Q", // pdf type 2 
    "t_negotiation" => "Negociação",
    "t_market_type" => "Tipo mercado",
    "t_deadline" => "Prazo",
    "t_title_spec" => "Especificação do título",
    "t_note" => "Obs",
    "t_operation_adjustment_val" => "Valor Operação_Ajuste",
    "settlement_fee" => "Taxa de liquidação",
    "registration_fee" => "Taxa de Registro",
    "fees" => "Emolumentos",
    "clearing" => "Clearing",
    "iss" => "ISS",
    "IRRF_without_operations_base" => "IRRF",
    "others" => "Outras",
    "operations_value" => "Valor das operações",
    "operating_fee" => "Taxa operacional", // pdf type 1
    "registration_fee_BM_F" => "Taxa registro BM&F",
    "rate_BM_F" => "Taxas BM&F",
    "total_expenses" => "Total das despesas",
    "pdv_total_amount" => "PDV_MontanteTotal", // Calculation results
    "pdv_total_fees" => "PDV_TaxaTotal",
    "pdv" => "PDV",
    "ap_total_amount" => "AP_MontanteTotal",
    "ap_total_quant" => "AP_QuantidadeTotal",
    "avg_price" => "AP",
    "d_ticker" => "Ticker"
);
?>