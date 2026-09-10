// components/ConfirmationModal.tsx
import { setHeight } from "@lib";
import { COLORS } from "constants/Colors";
import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
interface ConfirmationModalProps {
  visible: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  message,
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <View style={styles.container}>
          <Text style={styles.message1}>Sync to EHR</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.cancel]}
              onPress={onCancel}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.confirm]}
              onPress={onConfirm}
            >
              <Text style={styles.confirmText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ConfirmationModal;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    width: "80%",
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    paddingVertical: setHeight(3),
  },
  message: {
    fontSize: setHeight(1.8),
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
    fontWeight: "500",
    paddingVertical: setHeight(2),
  },
  message1: {
    fontSize: setHeight(2.5),
    textAlign: "center",
    marginBottom: 20,
    color: COLORS.primary,
    fontWeight: "bold",
    paddingVertical: setHeight(2),
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    flex: 1,
    paddingVertical: setHeight(2),
    borderRadius: setHeight(5),
    marginHorizontal: setHeight(1),
    alignItems: "center",
  },
  cancel: {
    backgroundColor: "#f0f0f0",
  },
  confirm: {
    backgroundColor: COLORS.primary,
  },
  cancelText: {
    color: "#333",
    fontWeight: "600",
  },
  confirmText: {
    color: "#fff",
    fontWeight: "600",
  },
});
