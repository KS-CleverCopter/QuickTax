import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
  Select,
  Text,
  useToast,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { GrayBox } from "./UiComponents";

export const NovaMovimentoForm = ({ cpf, cname }: { cpf: string; cname: string }) => {

  const toast = useToast();

  const [form, setForm] = useState<any>(null);
  useEffect(() => {
    setForm({
      tipoDeMovimentacao: "",
      compraVenda: "",
      DC: "D",
      dayTrade: false,
      tickerDoAtivo: "",
      quantidadeDeAcoes: "",
      precoAjuste: "",
      valorDeOpAjuste: "",
      rateio: "",
      IRRF: "",
      numeroDaNota: "",
      dataPregao: "",
      prazo: "",
      uname: "",
    });

    fetch(`${process.env.REACT_APP_API_HOST}/view.php?req=cname&cid=` + cpf)
      .then((res) => res.json())
      .then((r) => {
        if (r.status === 'Success' && r.data.length > 0) {
          setForm((prev: any) => ({
            ...prev,
            'uname': r.data[0].client_name,
          }));
        }
      });
  }, []);

  const [currentSelection, setCurrentSelection] = useState<any>(null);

  const updateForm = (e: any, key: string) => {
    let elm = e.target as HTMLInputElement;

    if (key === 'tipoDeMovimentacao') {
      setCurrentSelection(elm.value);
    }

    let val: any = elm.value;
    if (elm.type === "checkbox") {
      val = elm.checked;
    }

    setForm((prev: any) => ({
      ...prev,
      [key]: val,
    }));
  };

  const formSubmit = (e: any) => {
    //This has all the formdata

    var mmyyyy_rx = /^[0-9]{2}[\/][0-9]{2}$/g;
    // alert(form.prazo);
    if (((form.tipoDeMovimentacao === 'OPCAO DE COMPRA' || form.tipoDeMovimentacao === 'OPCAO DE VENDA') && form.prazo !== '') && !mmyyyy_rx.test(form.prazo)) {
      alert("Enter a valid Prazo (mm/yy)");
    } else {
      const data = new FormData();
      data.append("client_id", cpf);
      data.append("username", form.uname);
      data.append("trans_type", form.tipoDeMovimentacao);
      data.append("cv", form.compraVenda);
      data.append("dc", form.DC);
      data.append("dayTrade", form.dayTrade);
      data.append("ticker", form.tickerDoAtivo);
      data.append("qnty", form.quantidadeDeAcoes);
      data.append("prece", form.precoAjuste);
      data.append("op_adj", form.valorDeOpAjuste);
      data.append("rateio", form.rateio);
      data.append("irrf", form.IRRF);
      data.append("nota_no", form.numeroDaNota);
      data.append("tdate", form.dataPregao);
      data.append("deadline", form.prazo);

      // Do server upload API here.
      fetch(`${process.env.REACT_APP_API_HOST}/novamovi.php`, {
        method: "POST",
        body: data,
      })
        .then((res) => res.json())
        .then((r) => {
          if (r.status === 'Success') {
            toast({
              title: "Data Saved!",
              description: r.message,
              status: "success",
              duration: 3000,
              isClosable: true,
              position: "top",
            });
            // setForm([]);
          } else {
            toast({
              title: "Failed to save!",
              description: 'Failed to save!',
              status: "error",
              duration: 3000,
              isClosable: true,
              position: "top",
            });
          }
        });
    }
    e.preventDefault();
  };
  return (
    <Box>
      <Heading>Nova Movimentação</Heading>
      {form && (
        <FormControl>
          <form onSubmit={formSubmit}>
            <GrayBox
              props={{
                m: 4,
                mt: "7",
                p: 4,
                minWidth: "200px",
                width: "50%",
              }}
            >
              <HStack spacing={4} justifyContent="space-between" align={'middle'}>
                <Box w="50%">
                  <Heading size="xs" mb="2px">
                    Nome
                  </Heading>
                  <Input
                    onChange={(e) => {
                      updateForm(e, "uname");
                    }}
                    value={form.uname}
                    type="text"
                    isRequired={true}
                  />
                </Box>
                <Box w="50%">
                  <Heading size="xs" mb="2px">
                    CPF
                  </Heading>
                  <Text display="flex" alignItems="center" justifyContent="flexStart" h="33px">{cpf}</Text>
                </Box>
              </HStack>
            </GrayBox>
            <Box p="5">
              <Box mt="8">
                <HStack spacing="4" alignItems="flex-end">
                  <Box>
                    <FormLabel>Tipo de movimentação</FormLabel>
                    <Select
                      value={form.tipoDeMovimentacao}
                      isRequired={true}
                      onChange={(e) => {
                        updateForm(e, "tipoDeMovimentacao");
                      }}
                    >
                      <option value=""></option>
                      <option value="VISTA">À vista</option>
                      <option value="OPCAO DE COMPRA">Opção de compra</option>
                      <option value="OPCAO DE VENDA">Opção de venda</option>
                      <option value="TERMO">Termo</option>
                      <option value="LUCRO">Lucro</option>
                      <option value="PREJUIZO">Prejuízo</option>
                    </Select>
                  </Box>
                  <Box>
                    <FormLabel>Compra / venda</FormLabel>
                    <Select
                      isRequired={('LUCRO|PREJUIZO'.indexOf(currentSelection) !== -1 ? false : true)}
                      onChange={(e) => {
                        updateForm(e, "compraVenda");
                      }}
                      value={form.compraVenda}
                    >
                      <option value=""></option>
                      <option value="C">Buy</option>
                      <option value="V">Sell</option>
                    </Select>
                  </Box>
                  <Box>
                    <FormLabel>D/C</FormLabel>
                    <Select
                      isRequired={('LUCRO|PREJUIZO'.indexOf(currentSelection) !== -1 ? false : true)}
                      onChange={(e) => {
                        updateForm(e, "DC");
                      }}
                      value={form.DC}
                    >
                      <option value=""></option>
                      <option value="D">D</option>
                      <option value="C">C</option>
                    </Select>
                  </Box>
                  <Checkbox
                    borderColor={'gray.400'}
                    
                    pb="2"
                    onChange={(e) => {
                      updateForm(e, "dayTrade");
                    }}
                    value="dayTrade"
                  >
                    Day - Trade
                  </Checkbox>
                </HStack>
              </Box>
              <Box mt="8">
                <Heading size="md" mb="2">
                  Principais
                </Heading>
                <HStack spacing="4" alignItems="flex-end">
                  <Box>
                    <FormLabel>Ticker do ativo</FormLabel>
                    <Input
                      onChange={(e) => {
                        updateForm(e, "tickerDoAtivo");
                      }}
                      isRequired={('LUCRO|PREJUIZO'.indexOf(currentSelection) !== -1 ? false : true)}
                      value={form.tickerDoAtivo}
                      type="text"
                    />
                  </Box>
                  <Box>
                    <FormLabel>Quantidade de ações</FormLabel>
                    <Input
                      onChange={(e) => {
                        updateForm(e, "quantidadeDeAcoes");
                      }}
                      isRequired={('LUCRO|PREJUIZO'.indexOf(currentSelection) !== -1 ? false : true)}
                      value={form.quantidadeDeAcoes}
                      type="number"
                    />
                  </Box>
                  <Box>
                    <FormLabel>Preço / Ajuste</FormLabel>
                    <Input
                      onChange={(e) => {
                        updateForm(e, "precoAjuste");
                      }}
                      isRequired={('LUCRO|PREJUIZO'.indexOf(currentSelection) !== -1 ? false : true)}
                      value={form.precoAjuste}
                      type="number"
                      step="0.01"
                    />
                  </Box>
                  <Box>
                    <FormLabel>Valor de Op/Ajuste</FormLabel>
                    {(currentSelection === 'PREJUIZO') ?
                      <Input
                        isRequired={true}
                        onChange={(e) => {
                          updateForm(e, "valorDeOpAjuste");
                        }}
                        value={form.valorDeOpAjuste}
                        type="number"
                        max="0.00"
                        step="0.01"
                      />
                      :
                      <Input
                        isRequired={true}
                        onChange={(e) => {
                          updateForm(e, "valorDeOpAjuste");
                        }}
                        value={form.valorDeOpAjuste}
                        type="number"
                        min="0.00"
                        step="0.01"
                      />
                    }
                  </Box>
                </HStack>
              </Box>
              <Box mt="8">
                <Heading size="md" mb="2">
                  Impostos/Rateio
                </Heading>
                <HStack spacing="4" alignItems="flex-end">
                  <Box>
                    <FormLabel>Rateio</FormLabel>
                    <Input
                      isRequired={('LUCRO|PREJUIZO'.indexOf(currentSelection) !== -1 ? false : true)}
                      onChange={(e) => {
                        updateForm(e, "rateio");
                      }}
                      value={form.rateio}
                      type="number"
                      step="0.01"
                    />
                  </Box>
                  <Box>
                    <FormLabel>I.R.R.F</FormLabel>
                    <Input
                      isRequired={('LUCRO|PREJUIZO'.indexOf(currentSelection) !== -1 ? false : true)}
                      onChange={(e) => {
                        updateForm(e, "IRRF");
                      }}
                      value={form.IRRF}
                      type="number"
                      step="0.01"
                    />
                  </Box>
                </HStack>
              </Box>
              <Box mt="8">
                <Heading size="md" mb="2">
                  Informações
                </Heading>
                <HStack spacing="4" alignItems="flex-end">
                  <Box>
                    <FormLabel>Número da nota</FormLabel>
                    <Input
                      isRequired={('LUCRO|PREJUIZO'.indexOf(currentSelection) !== -1 ? false : true)}
                      onChange={(e) => {
                        updateForm(e, "numeroDaNota");
                      }}
                      value={form.numeroDaNota}
                      type="text"
                    />
                  </Box>
                  <Box>
                    <FormLabel>Data Pregão</FormLabel>
                    <Input
                      isRequired={true}
                      onChange={(e) => {
                        updateForm(e, "dataPregao");
                      }}
                      value={form.dataPregao}
                      type="date"
                    />
                  </Box>
                  <Box>
                    <FormLabel>Prazo</FormLabel>
                    <Input
                      isRequired={('VISTA|LUCRO|PREJUIZO'.indexOf(currentSelection) !== -1 ? false : true)}
                      onChange={(e) => {
                        updateForm(e, "prazo");
                      }}
                      value={form.prazo}
                      placeholder="mm/yy"
                    />
                  </Box>
                </HStack>
              </Box>
              <Box mt="8">
                <Button type="submit" colorScheme={"orange"}>
                  Submit
                </Button>
              </Box>
            </Box>
          </form>
        </FormControl>
      )}
    </Box>
  );
};
