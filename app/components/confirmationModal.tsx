// components/ConfirmationModal.tsx
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
      onRequestClose={onCancel}
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
    paddingVertical: 20,
  },
  message: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
    fontWeight: "500",
    paddingVertical: 8,
  },
  message1: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
    color: COLORS.primary,
    fontWeight: "bold",
    paddingVertical: 4,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
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
