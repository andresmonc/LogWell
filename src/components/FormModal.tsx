import React, { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Modal, Portal, Title, Button, useTheme } from 'react-native-paper';

interface FormModalProps {
  visible: boolean;
  onDismiss: () => void;
  title: string;
  children: ReactNode;
  onSubmit: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  submitDisabled?: boolean;
}

export default function FormModal({
  visible,
  onDismiss,
  title,
  children,
  onSubmit,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  submitDisabled = false,
}: FormModalProps) {
  const theme = useTheme();

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
      >
        <ScrollView>
          <Title style={styles.modalTitle}>{title}</Title>
          {children}
          <View style={styles.modalActions}>
            <Button 
              mode="outlined" 
              onPress={onDismiss}
              style={styles.modalButton}
            >
              {cancelLabel}
            </Button>
            <Button 
              mode="contained" 
              onPress={onSubmit}
              style={styles.modalButton}
              disabled={submitDisabled}
            >
              {submitLabel}
            </Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: {
    margin: 20,
    padding: 24,
    borderRadius: 12,
    maxHeight: '85%',
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 24,
    paddingTop: 16,
  },
  modalButton: {
    flex: 1,
  },
});