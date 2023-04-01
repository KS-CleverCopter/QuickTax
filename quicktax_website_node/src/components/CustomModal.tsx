import {
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
  useDisclosure,
} from "@chakra-ui/react";
import { ReactNode, useEffect, useState } from "react";

export const CustomModal = ({
  onCloseCallBack,
  children,
  size,
}: {
  onCloseCallBack: () => void;
  children: ReactNode;
  size?: "xl" | "2xl" | "4xl" | "6xl" | "sm" | "md" | "lg";
}) => {
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  useEffect(() => {
    onOpen();
    setModalOpen(isOpen);
  }, []);
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        // setModalOpen(false);
        onClose();
        onCloseCallBack();
      }}
      size={size || "6xl"}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalBody overflow={'auto'} mt="12">{children}</ModalBody>
      </ModalContent>
    </Modal>
  );
};
