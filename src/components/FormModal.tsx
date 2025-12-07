import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Modal, Portal, Title, Button, useTheme } from 'react-native-paper';
import type { FormModalProps } from '../types/ui';

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
          {submitLabel && (
            <View style={styles.modalActions}>
              <Button 
                mode="outlined" 
                onPress={onDismiss}
                style={styles.modalButton}
              >
                {cancelLabel || 'Cancel'}
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
          )}
          {!submitLabel && cancelLabel && (
            <View style={styles.modalActions}>
              <Button 
                mode="contained" 
                onPress={onDismiss}
                style={[styles.modalButton, { flex: 0, alignSelf: 'center' }]}
              >
                {cancelLabel}
              </Button>
            </View>
          )}
        </ScrollView>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: {
    margin: '1%',
    padding: 24,
    borderRadius: 12,
  },
  modalTitle: {
    textAlign: 'center',
    // marginBottom: 16,
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