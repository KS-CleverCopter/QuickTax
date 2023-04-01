#!/bin/bash
PYTHON_HOME="/usr/bin/python3.9"
SERVICE="/home/bitnami/qtax/quicktax_pdf_extract.py"

pscnt=`ps -ef | grep $SERVICE | wc -l`

if [ $pscnt -eq 2 ] 
then
    echo $(date) " >> $SERVICE is already running !"
else
    echo $(date) " >> $SERVICE Not running! Staring now..."
    $PYTHON_HOME $SERVICE
fi