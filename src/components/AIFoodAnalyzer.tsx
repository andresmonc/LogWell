import React, { useState } from 'react';
import { View, StyleSheet, Image, Platform } from 'react-native';
import {
    Card,
    Title,
    Text,
    Button,
    TextInput,
    ActivityIndicator,
    useTheme,
    Divider
} from 'react-native-paper';
import { analyzeFood } from '../services/openai';

// Platform-specific image picker imports
let launchImageLibrary: any;
let launchCamera: any;
let MediaType: any;

if (Platform.OS === 'web') {
  const webImagePicker = require('../utils/imagePicker.web');
  launchImageLibrary = webImagePicker.launchImageLibrary;
  launchCamera = webImagePicker.launchCamera;
  MediaType = { photo: 'photo' as const };
} else {
  const nativeImagePicker = require('react-native-image-picker');
  launchImageLibrary = nativeImagePicker.launchImageLibrary;
  launchCamera = nativeImagePicker.launchCamera;
  MediaType = nativeImagePicker.MediaType;
}
import { sharedStyles } from '../utils/sharedStyles';
import { showMultiOptionAlert } from '../utils/alertUtils';
import { showWarning } from '../utils/errorHandler';
import { showToastError } from '../utils/toastUtils';
import type { AIFoodAnalyzerProps } from '../types/components';

export default function AIFoodAnalyzer({
    apiKey,
    onAnalysisComplete,
    onRequestApiKey,
    isModal = false,
    initialDescription = '',
    initialImage = null
}: AIFoodAnalyzerProps) {
    const theme = useTheme();
    const [description, setDescription] = useState(initialDescription);
    const [selectedImage, setSelectedImage] = useState<string | null>(initialImage);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const handleImagePicker = () => {
        showMultiOptionAlert({
            title: 'Select Image',
            message: 'Choose how you want to add an image',
            options: [
                { text: 'Camera', onPress: () => openCamera() },
                { text: 'Photo Library', onPress: () => openImageLibrary() },
                { text: 'Cancel', style: 'cancel', onPress: () => {} }
            ]
        });
    };

    const openCamera = () => {
        launchCamera(
            {
                mediaType: 'photo' as MediaType,
                quality: 0.7,
                includeBase64: true,
            },
            (response) => {
                if (response.assets?.[0]?.base64) {
                    setSelectedImage(response.assets[0].base64);
                }
            }
        );
    };

    const openImageLibrary = () => {
        launchImageLibrary(
            {
                mediaType: 'photo' as MediaType,
                quality: 0.7,
                includeBase64: true,
            },
            (response) => {
                if (response.assets?.[0]?.base64) {
                    setSelectedImage(response.assets[0].base64);
                }
            }
        );
    };

    const handleAnalyze = async () => {
        if (!apiKey) {
            showMultiOptionAlert({
                title: 'API Key Required',
                message: 'Please configure your ChatGPT API key in the Profile section to use AI analysis.',
                options: [
                    { text: 'Cancel', style: 'cancel', onPress: () => {} },
                    { text: 'Configure', onPress: onRequestApiKey }
                ]
            });
            return;
        }

        if (!description.trim() && !selectedImage) {
            showWarning('Please provide either a description or image of the food.');
            return;
        }

        setIsAnalyzing(true);

        try {
            const result = await analyzeFood({
                description: description.trim() || undefined,
                imageBase64: selectedImage || undefined,
                apiKey
            });

            onAnalysisComplete(result, {
                description: description.trim(),
                image: selectedImage
            });

            // Reset form
            setDescription('');
            setSelectedImage(null);

        } catch (error) {
            console.error('AI analysis error:', error);

            // Extract user-friendly error message
            let userMessage = 'Failed to analyze food. Please try again.';
            const errorObj = error as any;
            const errorMsg = error instanceof Error ? error.message.toLowerCase() : '';
            
            if (error instanceof Error) {
                const errorMessage = errorMsg;
                
                // Handle common OpenAI API errors with user-friendly messages
                if (errorMessage.includes('quota') || errorMessage.includes('billing')) {
                    userMessage = 'Your OpenAI API quota has been exceeded. Please check your billing and plan details.';
                } else if (errorMessage.includes('invalid api key') || errorMessage.includes('incorrect api key') || errorMessage.includes('api key')) {
                    userMessage = 'Invalid API key. Please check your ChatGPT API key in the Profile section.';
                } else if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
                    userMessage = 'Too many requests. Please wait a moment and try again.';
                } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
                    userMessage = 'Network error. Please check your internet connection and try again.';
                } else if (errorMessage.includes('timeout')) {
                    userMessage = 'Request timed out. Please try again.';
                } else if (errorObj.statusCode === 401) {
                    userMessage = 'Authentication failed. Please check your API key.';
                } else if (errorObj.statusCode === 429) {
                    userMessage = 'Rate limit exceeded. Please wait a moment and try again.';
                } else if (errorObj.statusCode === 500 || errorObj.statusCode >= 500) {
                    userMessage = 'OpenAI service error. Please try again later.';
                } else if (errorMessage.includes('no response from chatgpt')) {
                    userMessage = 'No response from AI. Please try again.';
                } else if (errorMessage.includes('invalid json') || errorMessage.includes('invalid response format')) {
                    userMessage = 'AI returned an unexpected response. Please try again.';
                } else {
                    // For other errors, use a sanitized version of the error message
                    // Remove technical details but keep useful info
                    const sanitized = error.message
                        .replace(/For more information on this error, read the docs:.*/i, '')
                        .replace(/https?:\/\/[^\s]+/g, '')
                        .trim();
                    
                    if (sanitized && sanitized.length < 150) {
                        userMessage = sanitized;
                    }
                }
            }

            // Show error toast notification
            showToastError(userMessage, 5000);

            // Check if we have the raw AI response to show (for debugging)
            const rawResponse = errorObj?.rawResponse;
            
            // Only show detailed alert for certain error types or if user wants to see raw response
            // For most errors, the toast is sufficient
            if (rawResponse && (errorObj.statusCode === 200 || errorMsg.includes('invalid json'))) {
                // Show alert with option to see raw response for parsing errors
                showMultiOptionAlert({
                    title: 'Analysis Failed',
                    message: `${userMessage}\n\nWould you like to see the raw AI response?`,
                    options: [
                        { text: 'OK', style: 'default' as const, onPress: () => {} },
                        { text: 'Show Raw Response', onPress: () => {
                            showMultiOptionAlert({
                                title: 'Raw AI Response',
                                message: rawResponse.substring(0, 500) + (rawResponse.length > 500 ? '...' : ''),
                                options: [
                                    { text: 'Close', onPress: () => {} }
                                ]
                            });
                        }},
                        ...(errorMsg.includes('api key')
                            ? [{ text: 'Configure API Key', onPress: onRequestApiKey }]
                            : [])
                    ]
                });
            } else if (error instanceof Error && (errorMsg.includes('api key') || errorObj.statusCode === 401)) {
                // Show alert with option to configure API key for auth errors
                showMultiOptionAlert({
                    title: 'Authentication Error',
                    message: userMessage,
                    options: [
                        { text: 'OK', style: 'default' as const, onPress: () => {} },
                        { text: 'Configure API Key', onPress: onRequestApiKey }
                    ]
                });
            }
        } finally {
            setIsAnalyzing(false);
        }
    };

    const removeImage = () => {
        setSelectedImage(null);
    };

    if (!apiKey) {
        const content = (
            <>
                <Text style={styles.description}>
                    Get instant nutrition estimates by describing your food or taking a photo!
                </Text>
                <Text style={styles.apiKeyNote}>
                    Configure your ChatGPT API key to enable this feature.
                </Text>
                <Button
                    mode="outlined"
                    onPress={onRequestApiKey}
                    style={styles.configureButton}
                    icon="key"
                >
                    Configure API Key
                </Button>
            </>
        );

        if (isModal) {
            return content;
        }

        return (
            <Card style={styles.card}>
                <Card.Content>
                    <Title>AI Food Analysis</Title>
                    {content}
                </Card.Content>
            </Card>
        );
    }

    const content = (
        <>
            <Text style={styles.description}>
                Describe your food or take a photo for instant nutrition estimates
            </Text>

            {!isModal && <Divider style={styles.divider} />}

            <TextInput
                label="Describe the food (optional)"
                value={description}
                onChangeText={setDescription}
                style={sharedStyles.input}
                mode="outlined"
                placeholder="e.g., Large banana, grilled chicken breast, slice of pizza..."
                multiline
                numberOfLines={3}
            />

            <View style={styles.imageSection}>
                {selectedImage ? (
                    <View style={styles.selectedImageContainer}>
                        <Image
                            source={{ uri: `data:image/jpeg;base64,${selectedImage}` }}
                            style={styles.selectedImage}
                            resizeMode="cover"
                        />
                        <Button
                            mode="text"
                            onPress={removeImage}
                            style={styles.removeImageButton}
                            textColor={theme.colors.error}
                        >
                            Remove Image
                        </Button>
                    </View>
                ) : (
                    <Button
                        mode="outlined"
                        onPress={handleImagePicker}
                        style={styles.imageButton}
                        icon="camera"
                    >
                        Add Photo
                    </Button>
                )}
            </View>

            <Button
                mode="contained"
                onPress={handleAnalyze}
                disabled={isAnalyzing || (!description.trim() && !selectedImage)}
                style={styles.analyzeButton}
                icon={isAnalyzing ? undefined : "robot-outline"}
            >
                {isAnalyzing ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color={theme.colors.onPrimary} />
                        <Text style={[styles.loadingText, { color: theme.colors.onPrimary }]}>
                            Analyzing...
                        </Text>
                    </View>
                ) : (
                    'Analyze with AI'
                )}
            </Button>

            <Text style={styles.note}>
                AI analysis provides estimates. Always verify nutrition information for accurate tracking.
            </Text>
        </>
    );

    if (isModal) {
        return content;
    }

    return (
        <Card style={styles.card}>
            <Card.Content>
                <Title>🤖 AI Food Analysis</Title>
                {content}
            </Card.Content>
        </Card>
    );
}

const styles = StyleSheet.create({
    card: {
        marginBottom: 16,
    },
    description: {
        marginBottom: 8,
        opacity: 0.8,
    },
    apiKeyNote: {
        marginTop: 8,
        marginBottom: 16,
        opacity: 0.7,
        fontStyle: 'italic',
    },
    configureButton: {
        alignSelf: 'flex-start',
    },
    divider: {
        marginVertical: 16,
    },
    imageSection: {
        marginBottom: 16,
    },
    selectedImageContainer: {
        alignItems: 'center',
    },
    selectedImage: {
        width: 200,
        height: 150,
        borderRadius: 8,
        marginBottom: 8,
    },
    removeImageButton: {
        marginTop: 4,
    },
    imageButton: {
        alignSelf: 'flex-start',
    },
    analyzeButton: {
        marginTop: 16,
        marginBottom: 8,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    loadingText: {
        fontSize: 16,
    },
    note: {
        fontSize: 12,
        opacity: 0.6,
        textAlign: 'center',
        fontStyle: 'italic',
    },
});