#!/bin/bash
PYTHON_HOME="/usr/bin/python3.9"
CALC_SERVICE="/home/bitnami/qtax/calc.py"
CALC_MSERVICE="/home/bitnami/qtax/calc_manual.py"

calc_pscnt=`ps -ef | grep $CALC_SERVICE | wc -l`

if [ $calc_pscnt -eq 2 ]
then
    echo $(date) " >> $CALC_SERVICE is already running !"
else
    echo $(date) " >> $CALC_SERVICE Not running! Staring now..."
    $PYTHON_HOME $CALC_SERVICE
fi


calc_mpscnt=`ps -ef | grep $CALC_MSERVICE | wc -l`

if [ $calc_mpscnt -eq 2 ]
then
    echo $(date) " >> $CALC_MSERVICE is already running !"
else
    echo $(date) " >> $CALC_MSERVICE Not running! Staring now..."
    $PYTHON_HOME /home/bitnami/qtax/calc_manual.py
fi