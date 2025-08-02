import React, { useState } from 'react';
import { View, StyleSheet, Alert, Image } from 'react-native';
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
import { launchImageLibrary, launchCamera, MediaType } from 'react-native-image-picker';
import { analyzeFood } from '../services/openai';
import { sharedStyles } from '../utils/sharedStyles';
import type { NutritionInfo } from '../types/nutrition';

interface AIFoodAnalyzerProps {
    apiKey: string | null;
    onAnalysisComplete: (result: {
        name: string;
        brand?: string;
        servingSize: string;
        nutrition: NutritionInfo;
        confidence: number;
        reasoning?: string;
    }, originalInput: { description: string; image: string | null }) => void;
    onRequestApiKey: () => void;
    isModal?: boolean;
    initialDescription?: string;
    initialImage?: string | null;
}

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
        Alert.alert(
            'Select Image',
            'Choose how you want to add an image',
            [
                { text: 'Camera', onPress: () => openCamera() },
                { text: 'Photo Library', onPress: () => openImageLibrary() },
                { text: 'Cancel', style: 'cancel' }
            ]
        );
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
            Alert.alert(
                'API Key Required',
                'Please configure your ChatGPT API key in the Profile section to use AI analysis.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Configure', onPress: onRequestApiKey }
                ]
            );
            return;
        }

        if (!description.trim() && !selectedImage) {
            Alert.alert('Input Required', 'Please provide either a description or image of the food.');
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

            // Check if we have the raw AI response to show
            const rawResponse = (error as any)?.rawResponse;
            const errorMessage = error instanceof Error ? error.message : 'Failed to analyze food. Please try again.';

            const buttons = [
                { text: 'OK', style: 'default' as const },
                ...(error instanceof Error && error.message.includes('API key')
                    ? [{ text: 'Configure API Key', onPress: onRequestApiKey }]
                    : []),
                ...(rawResponse
                    ? [{
                        text: 'Show AI Response',
                        onPress: () => Alert.alert(
                            'AI Response',
                            `Raw response from ChatGPT:\n\n${rawResponse}`,
                            [{
                                text: 'Copy', onPress: () => {
                                    // You could add clipboard functionality here if needed
                                }
                            }, { text: 'Close' }]
                        )
                    }]
                    : [])
            ];

            Alert.alert('Analysis Failed', errorMessage, buttons);
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