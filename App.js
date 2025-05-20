import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, TextInput, Alert, Dimensions, SafeAreaView, Modal, Animated, PanResponder, Image, Keyboard, TouchableWithoutFeedback, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Line } from 'react-native-svg';
import { BlurView } from 'expo-blur';
import MaskedView from '@react-native-masked-view/masked-view';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const { width, height } = Dimensions.get('window');

const BG_GRADIENT = ['#13151B', '#0A0A0D'];
const CARD_GRADIENT = ['#1B2B4A', '#23262F'];
const CARD_BORDER = '#2A3A5A';
const CARD_SHADOW = '#0331FF44';
const SECONDARY = '#0331FF';
const TEXT_MAIN = '#fff';
const TEXT_SECONDARY = '#6C6C6C';

function GridBackground() {
  // Сетка 40x40 px
  const step = 40;
  const lines = [];
  for (let i = 0; i < width; i += step) {
    lines.push(<Line key={`v${i}`} x1={i} y1={0} x2={i} y2={height} stroke="#23304A" strokeWidth="1" opacity={0.1} />);
  }
  for (let i = 0; i < height; i += step) {
    lines.push(<Line key={`h${i}`} x1={0} y1={i} x2={width} y2={i} stroke="#23304A" strokeWidth="1" opacity={0.1} />);
  }
  return (
    <Svg style={StyleSheet.absoluteFill} width={width} height={height}>
      {lines}
    </Svg>
  );
}

function FolderCard({ name, description, onPress, onEdit }) {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={{ flex: 1 }}>
      <LinearGradient colors={CARD_GRADIENT} style={styles.folderCard} start={{x:0, y:0}} end={{x:1, y:1}}>
        <View style={styles.folderIconBox}>
          <Feather name="folder" size={32} color={SECONDARY} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.folderTitle}>{name}</Text>
          {!!description && <Text style={styles.folderDesc}>{description}</Text>}
        </View>
        <TouchableOpacity onPress={onEdit} style={styles.editIconBox} activeOpacity={0.7}>
          <Feather name="edit-2" size={20} color={SECONDARY} />
        </TouchableOpacity>
      </LinearGradient>
    </TouchableOpacity>
  );
}

function withHaptic(fn) {
  return (...args) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fn(...args);
  };
}

// Экран Курсы (заглушка)
function CoursesScreen({ navigation }) {
  return (
    <LinearGradient colors={BG_GRADIENT} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={[styles.title, { fontSize: 26 }]}>Курсы</Text>
      <Text style={[styles.folderDesc, { fontSize: 16, marginTop: 10 }]}>Здесь скоро появятся курсы!</Text>
      <View style={{ marginTop: 30 }}>
        <ModernButton onPress={() => navigation.navigate('CreateCourse')} iconRight={<Feather name="plus" size={22} color="#2563EB" />}>Создать курс</ModernButton>
      </View>
    </LinearGradient>
  );
}

// Главный экран теперь называется Заучивание
function LearningScreen({ navigation }) {
  const [folders, setFolders] = React.useState([]);
  const [editModalVisible, setEditModalVisible] = React.useState(false);
  const [editFolder, setEditFolder] = React.useState(null);
  const [editName, setEditName] = React.useState('');

  const addNewFolder = (newFolder) => {
    setFolders([...folders, { ...newFolder, id: Date.now().toString(), topics: [] }]);
  };

  const handleCreateFolder = () => {
    navigation.navigate('CreateFolder', { onAdd: addNewFolder });
  };

  const handleOpenFolder = (folder) => {
    navigation.navigate('Folder', { folder, updateFolder: handleUpdateFolder });
  };

  const handleEditFolder = (folder) => {
    setEditFolder(folder);
    setEditName(folder.name);
    setEditModalVisible(true);
  };

  const handleSaveEdit = () => {
    setFolders(folders.map(f => f.id === editFolder.id ? { ...f, name: editName } : f));
    setEditModalVisible(false);
  };

  const handleDeleteFolder = () => {
    setFolders(folders.filter(f => f.id !== editFolder.id));
    setEditModalVisible(false);
  };

  const handleUpdateFolder = (updatedFolder) => {
    setFolders(folders.map(f => f.id === updatedFolder.id ? updatedFolder : f));
  };

  const isNameChanged = editFolder && editName !== editFolder.name;

  return (
    <LinearGradient colors={BG_GRADIENT} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <GridBackground />
        <View style={styles.headerBox}>
          <Feather name="folder" size={48} color={SECONDARY} style={{ marginBottom: 10 }} />
          <Text style={styles.title}>Мои папки</Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            Создавайте папки для своих{"\n"}коллекций терминов
          </Text>
        </View>
        <FlatList
          data={folders}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingBottom: 30 }}
          renderItem={({ item }) => (
            <View style={styles.folderCardShadow}>
              <FolderCard
                name={item.name}
                description={item.description}
                onPress={withHaptic(() => handleOpenFolder(item))}
                onEdit={withHaptic(() => handleEditFolder(item))}
              />
            </View>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>Папок пока нет</Text>}
        />
        <View style={{ marginBottom: 80 }}>
          <ModernButton onPress={withHaptic(handleCreateFolder)} iconRight={<Feather name="arrow-right" size={22} color="#2563EB" />}>Создать папку</ModernButton>
        </View>
        {/* Модальное окно редактирования папки */}
        <Modal
          visible={editModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setEditModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Редактировать папку</Text>
              <TextInput
                style={styles.input}
                value={editName}
                onChangeText={setEditName}
                placeholder="Название папки"
                placeholderTextColor={TEXT_SECONDARY}
              />
              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: 10 }}>
                <SmallRedButton onPress={withHaptic(handleDeleteFolder)} icon={<Feather name="trash-2" size={20} color="#fff" />}>Удалить</SmallRedButton>
                <SmallGrayButton onPress={withHaptic(() => setEditModalVisible(false))}>Отменить</SmallGrayButton>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

// Кастомный таббар
function CustomTabBar({ state, descriptors, navigation }) {
  return (
    <View style={customTabBarStyles.container}>
      <View style={customTabBarStyles.tabBarBox}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate(route.name);
            }
          };

          // Иконки для вкладок
          let iconName = 'circle';
          if (route.name === 'Заучивание') iconName = 'book-open';
          if (route.name === 'Курсы') iconName = 'book';

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              style={customTabBarStyles.tabBtn}
              activeOpacity={0.85}
            >
              <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                <Feather
                  name={iconName}
                  size={28}
                  color={isFocused ? '#2563EB' : '#6C6C6C'}
                  style={isFocused ? customTabBarStyles.activeIcon : {}}
                />
                <Text style={[customTabBarStyles.label, isFocused && customTabBarStyles.activeLabel]}>{label}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const customTabBarStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: Platform.OS === 'ios' ? 36 : 24,
    zIndex: 100,
  },
  tabBarBox: {
    flexDirection: 'row',
    backgroundColor: '#181F2A',
    borderRadius: 32,
    paddingHorizontal: 18,
    paddingVertical: 8,
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 16,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  label: {
    fontSize: 12,
    color: '#6C6C6C',
    marginTop: 2,
    fontWeight: 'bold',
  },
  activeLabel: {
    color: '#2563EB',
  },
  activeIcon: {
    textShadowColor: 'rgba(37,99,235,0.45)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
});

// Tab Navigator
function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Заучивание" component={LearningScreen} />
      <Tab.Screen name="Курсы" component={CoursesScreen} />
    </Tab.Navigator>
  );
}

function CreateFolderScreen({ navigation, route }) {
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');

  const handleSubmit = () => {
    if (!name.trim()) {
      Alert.alert('Ошибка', 'Пожалуйста, введите название папки');
      return;
    }
    route.params.onAdd({ name, description });
    navigation.goBack();
  };

  return (
    <LinearGradient colors={BG_GRADIENT} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <GridBackground />
        <View style={styles.headerBox}>
          <Feather name="folder" size={48} color={SECONDARY} style={{ marginBottom: 10 }} />
          <Text style={styles.title}>Создать папку</Text>
          <Text style={styles.subtitle}>Придумайте название и описание</Text>
        </View>
        <View style={styles.formBox}>
          <TextInput
            style={styles.input}
            placeholder="Название папки"
            placeholderTextColor={TEXT_SECONDARY}
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Описание (необязательно)"
            placeholderTextColor={TEXT_SECONDARY}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />
          <ModernButton onPress={withHaptic(handleSubmit)} iconRight={<Feather name="arrow-right" size={22} color="#2563EB" />}>Создать</ModernButton>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

// Экран папки с темами
function FolderScreen({ route, navigation }) {
  const { folder, updateFolder } = route.params;
  const [topics, setTopics] = React.useState(folder.topics || []);
  const [modalVisible, setModalVisible] = React.useState(false);
  const [topicName, setTopicName] = React.useState('');

  const handleAddTopic = () => {
    if (!topicName.trim()) return;
    const newTopics = [...topics, { id: Date.now().toString(), name: topicName, terms: [] }];
    setTopics(newTopics);
    updateFolder({ ...folder, topics: newTopics });
    setTopicName('');
    setModalVisible(false);
  };

  const handleOpenTopic = (topic) => {
    navigation.navigate('Topic', { topic, updateTopic: handleUpdateTopic });
  };

  const handleUpdateTopic = (updatedTopic) => {
    const newTopics = topics.map(t => t.id === updatedTopic.id ? updatedTopic : t);
    setTopics(newTopics);
    updateFolder({ ...folder, topics: newTopics });
  };

  return (
    <LinearGradient colors={BG_GRADIENT} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <GridBackground />
        <View style={styles.headerBox}>
          <Feather name="folder" size={44} color={SECONDARY} style={{ marginBottom: 10 }} />
          <Text style={styles.title}>{folder.name}</Text>
          {folder.description ? (
            <Text style={styles.subtitle}>{folder.description}</Text>
          ) : null}
        </View>
        <FlatList
          data={topics}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingBottom: 30 }}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={withHaptic(() => handleOpenTopic(item))} activeOpacity={0.85}>
              <View style={styles.folderCardShadow}>
                <LinearGradient colors={CARD_GRADIENT} style={styles.folderCard} start={{x:0, y:0}} end={{x:1, y:1}}>
                  <Feather name="file-text" size={28} color={SECONDARY} style={{ marginRight: 18 }} />
                  <Text style={styles.folderTitle}>{item.name}</Text>
                </LinearGradient>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>Тем пока нет</Text>}
        />
        <ModernButton onPress={withHaptic(() => setModalVisible(true))} iconRight={<Feather name="arrow-right" size={22} color="#2563EB" />}>Создать тему</ModernButton>
        {/* Модальное окно создания темы */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Создать тему</Text>
              <TextInput
                style={styles.input}
                value={topicName}
                onChangeText={setTopicName}
                placeholder="Название темы"
                placeholderTextColor={TEXT_SECONDARY}
              />
              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: 10 }}>
                <SmallGrayButton onPress={withHaptic(() => setModalVisible(false))}>Отменить</SmallGrayButton>
                <SmallGreenButton onPress={withHaptic(handleAddTopic)} icon={<Feather name="arrow-right" size={20} color="#fff" />}>Создать</SmallGreenButton>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

function shuffle(array) {
  let arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function generateQuiz(terms) {
  if (terms.length < 4) return [];
  const questions = shuffle(terms).map((card, idx, arr) => {
    // Выбираем 3 случайных неверных ответа
    const wrongTerms = shuffle(arr.filter(c => c.term !== card.term)).slice(0, 3).map(c => c.term);
    // Варианты ответа
    const options = shuffle([card.term, ...wrongTerms]);
    return {
      definition: card.definition,
      correct: card.term,
      options,
    };
  });
  return questions;
}

// Экран темы с добавлением терминов
function TopicScreen({ route, navigation }) {
  const { topic, updateTopic } = route.params;
  const [terms, setTerms] = React.useState(topic.terms || []);
  const [term, setTerm] = React.useState('');
  const [definition, setDefinition] = React.useState('');
  const [image, setImage] = React.useState(null);

  const handleAddTerm = () => {
    if (!term.trim() || !definition.trim()) return;
    const newTerms = [...terms, { id: Date.now().toString(), term, definition, image }];
    setTerms(newTerms);
    updateTopic({ ...topic, terms: newTerms });
    setTerm('');
    setDefinition('');
    setImage(null);
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImage(result.assets[0].uri);
    }
  };

  const handleOpenCards = () => {
    navigation.navigate('Cards', { terms });
  };

  const handleOpenQuiz = () => {
    navigation.navigate('Quiz', { terms });
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <LinearGradient colors={BG_GRADIENT} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }}>
          <GridBackground />
          <View style={styles.headerBox}>
            <Feather name="file-text" size={44} color={SECONDARY} style={{ marginBottom: 10 }} />
            <Text style={styles.title}>{topic.name}</Text>
          </View>
          <View style={styles.formBox}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                value={term}
                onChangeText={setTerm}
                placeholder="Термин"
                placeholderTextColor={TEXT_SECONDARY}
              />
              <TouchableOpacity onPress={withHaptic(pickImage)} style={{ marginLeft: 8, padding: 6 }}>
                <Feather name="paperclip" size={22} color={image ? SECONDARY : TEXT_SECONDARY} />
              </TouchableOpacity>
            </View>
            {image && (
              <View style={{ alignItems: 'flex-start', marginBottom: 8 }}>
                <Image source={{ uri: image }} style={{ width: 80, height: 60, borderRadius: 8, marginLeft: 2 }} />
              </View>
            )}
            <TextInput
              style={[styles.input, styles.textArea]}
              value={definition}
              onChangeText={setDefinition}
              placeholder="Описание / перевод"
              placeholderTextColor={TEXT_SECONDARY}
              multiline
              numberOfLines={2}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 10 }}>
              <SmallGrayModeButton onPress={withHaptic(handleOpenCards)} icon={<Feather name="arrow-right" size={18} color="#fff" />}>Карточки</SmallGrayModeButton>
              <SmallGrayModeButton onPress={withHaptic(handleOpenQuiz)} icon={<Feather name="arrow-right" size={18} color="#fff" />}>Заучивание</SmallGrayModeButton>
            </View>
            <ModernButton onPress={withHaptic(handleAddTerm)} iconRight={<Feather name="arrow-right" size={22} color="#2563EB" />}>Добавить</ModernButton>
          </View>
          <FlatList
            data={terms}
            keyExtractor={item => item.id}
            contentContainerStyle={{ paddingBottom: 30 }}
            renderItem={({ item }) => (
              <View style={styles.folderCardShadow}>
                <LinearGradient colors={CARD_GRADIENT} style={styles.folderCard} start={{x:0, y:0}} end={{x:1, y:1}}>
                  <Feather name="book-open" size={24} color={SECONDARY} style={{ marginRight: 18 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.folderTitle}>{item.term}</Text>
                    <Text style={styles.folderDesc}>{item.definition}</Text>
                    {item.image && (
                      <Image source={{ uri: item.image }} style={{ width: 60, height: 40, borderRadius: 6, marginTop: 4 }} />
                    )}
                  </View>
                </LinearGradient>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>Терминов пока нет</Text>}
          />
        </SafeAreaView>
      </LinearGradient>
    </TouchableWithoutFeedback>
  );
}

// Экран карточек
function CardsScreen({ route, navigation }) {
  const { terms } = route.params;
  const [index, setIndex] = React.useState(0);
  const [flipped, setFlipped] = React.useState(false);
  const [anim] = React.useState(new Animated.Value(0));
  const [swipeAnim] = React.useState(new Animated.Value(0));

  React.useEffect(() => {
    Animated.spring(anim, {
      toValue: flipped ? 1 : 0,
      useNativeDriver: true,
      friction: 8,
    }).start();
  }, [flipped]);

  const rotateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 20,
    onPanResponderMove: Animated.event([
      null,
      { dx: swipeAnim },
    ], { useNativeDriver: false }),
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dx < -80) {
        // Не знаю (свайп влево)
        nextCard();
      } else if (gesture.dx > 80) {
        // Знаю (свайп вправо)
        nextCard();
      } else {
        Animated.spring(swipeAnim, { toValue: 0, useNativeDriver: true }).start();
      }
    },
  });

  const nextCard = () => {
    Animated.timing(swipeAnim, { toValue: Math.sign(swipeAnim._value) * 500, duration: 200, useNativeDriver: true }).start(() => {
      setFlipped(false);
      setIndex((prev) => (prev + 1) % terms.length);
      swipeAnim.setValue(0);
    });
  };

  if (!terms.length) {
    return (
      <LinearGradient colors={BG_GRADIENT} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={styles.emptyText}>Нет карточек</Text>
      </LinearGradient>
    );
  }

  const card = terms[index];

  return (
    <LinearGradient colors={BG_GRADIENT} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <GridBackground />
      <Animated.View
        {...panResponder.panHandlers}
        style={{
          width: '85%',
          height: 220,
          borderRadius: 28,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 30,
          overflow: 'hidden',
          shadowColor: SECONDARY,
          shadowOpacity: 0.18,
          shadowRadius: 24,
          elevation: 10,
          transform: [
            { perspective: 1000 },
            { rotateY },
            { translateX: flipped ? Animated.multiply(swipeAnim, -1) : swipeAnim },
          ],
        }}
      >
        <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={{
          ...StyleSheet.absoluteFillObject,
          backgroundColor: 'rgba(255,255,255,0.18)',
          borderRadius: 28,
          borderWidth: 2,
          borderColor: 'rgba(51,102,255,0.35)',
          shadowColor: '#A3C8FF',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.25,
          shadowRadius: 32,
        }} />
        <TouchableOpacity style={{ flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' }} activeOpacity={0.9} onPress={withHaptic(() => setFlipped(f => !f))}>
          {card.image && (
            <Image source={{ uri: card.image }} style={{ width: 120, height: 90, borderRadius: 12, marginBottom: 10 }} />
          )}
          {!flipped ? (
            <Text style={[styles.title, { fontSize: 28 }]}>{card.term}</Text>
          ) : (
            <Text style={[styles.folderDesc, { fontSize: 22, color: TEXT_MAIN, textAlign: 'center', paddingHorizontal: 10, transform: [{ scaleX: -1 }] }]}>{card.definition}</Text>
          )}
        </TouchableOpacity>
      </Animated.View>
      <Text style={[styles.folderDesc, { color: TEXT_SECONDARY, marginBottom: 10 }]}>Карта {index + 1} из {terms.length}</Text>
      <ModernButton onPress={withHaptic(() => navigation.goBack())}>Назад</ModernButton>
    </LinearGradient>
  );
}

// Экран результатов теста
function QuizResultsScreen({ route, navigation }) {
  const { score, total, onRestart } = route.params;
  const percentage = Math.round((score / total) * 100);
  const [progressAnim] = React.useState(new Animated.Value(0));

  React.useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: score / total,
      useNativeDriver: false,
      friction: 8,
    }).start();
  }, []);

  return (
    <LinearGradient colors={BG_GRADIENT} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <GridBackground />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ alignItems: 'center', marginBottom: 40 }}>
            <Text style={[styles.title, { fontSize: 32, marginBottom: 16 }]}>Тест завершён!</Text>
            <Text style={[styles.folderDesc, { fontSize: 24, color: TEXT_SECONDARY }]}>
              {score} из {total}
            </Text>
          </View>

          {/* Прогресс-бар */}
          <View style={{ width: '100%', marginBottom: 40 }}>
            <View style={{ 
              height: 12, 
              backgroundColor: 'rgba(255,255,255,0.1)', 
              borderRadius: 6,
              overflow: 'hidden',
              marginBottom: 8
            }}>
              <Animated.View style={{
                height: '100%',
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%']
                }),
                backgroundColor: percentage >= 70 ? '#2AF598' : percentage >= 40 ? '#FFD60A' : '#FF3B30',
                borderRadius: 6,
              }} />
            </View>
            <Text style={[styles.folderDesc, { 
              fontSize: 18, 
              color: percentage >= 70 ? '#2AF598' : percentage >= 40 ? '#FFD60A' : '#FF3B30',
              textAlign: 'center'
            }]}>
              {percentage}% правильных ответов
            </Text>
          </View>

          <View style={{ width: '100%', gap: 16 }}>
            <ModernButton 
              onPress={withHaptic(onRestart)} 
              iconRight={<Feather name="refresh-cw" size={22} color="#2563EB" />}
            >
              Пройти ещё раз
            </ModernButton>
            <ModernButton 
              onPress={withHaptic(() => navigation.goBack())}
              iconRight={<Feather name="arrow-left" size={22} color="#2563EB" />}
            >
              Вернуться
            </ModernButton>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

// Экран заучивания (Quiz)
function QuizScreen({ route, navigation }) {
  const { terms } = route.params;
  const quiz = React.useMemo(() => generateQuiz(terms), [terms]);
  const [step, setStep] = React.useState(0);
  const [selected, setSelected] = React.useState(null);
  const [showAnswer, setShowAnswer] = React.useState(false);
  const [score, setScore] = React.useState(0);

  if (!quiz.length) {
    return (
      <LinearGradient colors={BG_GRADIENT} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={styles.emptyText}>Недостаточно терминов для теста (нужно минимум 4)</Text>
        <ModernButton onPress={withHaptic(() => navigation.goBack())}>Вернуться</ModernButton>
      </LinearGradient>
    );
  }

  const finished = step >= quiz.length;

  // Вычислять q и isCorrect только если тест не завершён
  const q = !finished ? quiz[step] : null;
  const isCorrect = !finished && q ? selected === q.correct : false;

  const handleSelect = (option) => {
    if (showAnswer) return;
    setSelected(option);
    setShowAnswer(true);
    if (option === q.correct) setScore(s => s + 1);
  };

  const handleNext = () => {
    setSelected(null);
    setShowAnswer(false);
    setStep(s => s + 1);
  };

  const handleRestart = () => {
    setStep(0);
    setScore(0);
    setSelected(null);
    setShowAnswer(false);
  };

  if (finished) {
    return (
      <QuizResultsScreen 
        route={{ 
          params: { 
            score, 
            total: quiz.length,
            onRestart: handleRestart
          } 
        }} 
        navigation={navigation} 
      />
    );
  }

  return (
    <LinearGradient colors={BG_GRADIENT} style={{ flex: 1, paddingHorizontal: 0 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <GridBackground />
        <View style={{ alignItems: 'center', marginTop: 60, marginBottom: 30 }}>
          <Text style={[styles.folderDesc, { color: TEXT_SECONDARY, fontSize: 16, marginBottom: 10 }]}>Вопрос {step + 1} из {quiz.length}</Text>
          <View style={{ width: '90%', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 18, padding: 18, marginBottom: 24, alignItems: 'center' }}>
            {q && q.image && (
              <Image source={{ uri: q.image }} style={{ width: 100, height: 75, borderRadius: 10, marginBottom: 10 }} />
            )}
            <Text style={[styles.title, { fontSize: 20, textAlign: 'center' }]}>{q.definition}</Text>
          </View>
        </View>
        <View style={{ width: '90%', alignSelf: 'center' }}>
          {q.options.map((option, idx) => {
            let bg = 'rgba(255,255,255,0.08)';
            let border = 'rgba(51,102,255,0.18)';
            if (showAnswer) {
              if (option === q.correct) {
                bg = 'rgba(0,200,100,0.18)';
                border = '#2AF598';
              } else if (option === selected) {
                bg = 'rgba(255,0,0,0.13)';
                border = '#ff3b30';
              }
            }
            return (
              <ModernButton
                key={option}
                onPress={withHaptic(() => handleSelect(option))}
                iconRight={selected === option && showAnswer ? (option === q.correct ? <Feather name="check" size={22} color="#2AF598" /> : <Feather name="x" size={22} color="#ff3b30" />) : null}>{String.fromCharCode(65 + idx)}) {option}</ModernButton>
            );
          })}
        </View>
        {showAnswer && (
          <ModernButton onPress={withHaptic(handleNext)} iconRight={<Feather name="arrow-right" size={22} color="#2563EB" />}>Далее</ModernButton>
        )}
        <View style={{ alignItems: 'center', marginTop: 18 }}>
          <Text style={[styles.folderDesc, { color: TEXT_SECONDARY }]}>Счёт: {score}</Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

// Grain-текстура (заглушка, можно заменить на png)
const Grain = () => (
  <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
    {/* Можно заменить на png или сгенерировать grain-эффект */}
    <Line x1="0" y1="0" x2="100%" y2="100%" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
  </Svg>
);

// Градиентный текст
function GradientText({ children, style }) {
  return (
    <MaskedView
      maskElement={<Text style={[{ color: 'black', fontWeight: 'bold' }, style]}>{children}</Text>}
    >
      <LinearGradient
        colors={["#fff", "#E0E7EF", "#A3B8D8"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ height: style?.fontSize || 18 }}
      >
        <Text style={[style, { opacity: 0 }]}>{children}</Text>
      </LinearGradient>
    </MaskedView>
  );
}

// Градиентная кнопка с поддержкой иконки
function GradientButton({ children, onPress, style, disabled, icon }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      disabled={disabled}
      style={[{
        borderRadius: 100,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.25)',
        backgroundColor: 'transparent',
      }, style]}
    >
      <LinearGradient
        colors={["#3B82F6", "#2563EB", "#1E40AF"]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingVertical: 16, paddingHorizontal: 32, borderRadius: 100, justifyContent: 'center', alignItems: 'center', flexDirection: 'row' }}
      >
        {/* Grain-эффект */}
        <View style={{ ...StyleSheet.absoluteFillObject, zIndex: 2 }} pointerEvents="none">
          <Grain />
        </View>
        {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
        <GradientText style={{ fontSize: 17, fontWeight: 'bold', letterSpacing: 0.5 }}>{children}</GradientText>
      </LinearGradient>
    </TouchableOpacity>
  );
}

// Кнопка в стиле примера (градиент, белый текст, круглая, тень, стрелка справа)
function ModernButton({ children, onPress, style, disabled, iconRight }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      disabled={disabled}
      style={[{
        borderRadius: 100,
        overflow: 'visible',
        shadowColor: '#2563EB',
        shadowOpacity: 0.18,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 8 },
        elevation: 8,
        marginVertical: 8,
      }, style]}
    >
      <LinearGradient
        colors={["#5EA8FF", "#2563EB"]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 18,
          paddingHorizontal: 32,
          borderRadius: 100,
        }}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 19, letterSpacing: 0.2 }}>{children}</Text>
        {iconRight && (
          <View style={{
            marginLeft: 18,
            backgroundColor: '#fff',
            borderRadius: 100,
            width: 38,
            height: 38,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#2563EB',
            shadowOpacity: 0.13,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 },
            elevation: 4,
          }}>
            {iconRight}
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

function SmallRedButton({ children, onPress, icon }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        backgroundColor: '#ff3b30',
        borderRadius: 100,
        paddingVertical: 12,
        paddingHorizontal: 22,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 0,
        marginRight: 10,
      }}
    >
      {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{children}</Text>
    </TouchableOpacity>
  );
}

function SmallGrayButton({ children, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        backgroundColor: '#23262F',
        borderRadius: 100,
        paddingVertical: 12,
        paddingHorizontal: 22,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 0,
      }}
    >
      <Text style={{ color: '#B0B0B0', fontWeight: 'bold', fontSize: 16 }}>{children}</Text>
    </TouchableOpacity>
  );
}

function SmallGreenButton({ children, onPress, icon }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        backgroundColor: '#2AF598',
        borderRadius: 100,
        paddingVertical: 12,
        paddingHorizontal: 22,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 0,
      }}
    >
      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{children}</Text>
      {icon && <View style={{ marginLeft: 8 }}>{icon}</View>}
    </TouchableOpacity>
  );
}

function SmallGrayModeButton({ children, onPress, icon }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        backgroundColor: '#23262F',
        borderRadius: 100,
        paddingVertical: 10,
        paddingHorizontal: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 0,
        marginHorizontal: 4,
      }}
    >
      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>{children}</Text>
      {icon && <View style={{ marginLeft: 8 }}>{icon}</View>}
    </TouchableOpacity>
  );
}

// Экран создания курса
function CreateCourseScreen({ navigation, route }) {
  const [video, setVideo] = React.useState(null);
  const [pdf, setPdf] = React.useState(null);

  const pickVideo = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      quality: 1,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setVideo(result.assets[0].uri);
    }
  };

  const pickPdf = async () => {
    let result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
    });
    if (result.type === 'success') {
      setPdf(result.uri);
    }
  };

  return (
    <LinearGradient colors={BG_GRADIENT} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <GridBackground />
        <View style={{ alignItems: 'center', marginTop: 40 }}>
          <Text style={[styles.title, { fontSize: 26, marginBottom: 18 }]}>Создать курс</Text>
          <ModernButton onPress={pickVideo} iconRight={<Feather name="video" size={22} color="#2563EB" />}>Загрузить видео</ModernButton>
          {video && <Text style={{ color: '#fff', marginTop: 8, marginBottom: 8 }}>Видео выбрано</Text>}
          <ModernButton onPress={pickPdf} iconRight={<Feather name="file" size={22} color="#2563EB" />}>Прикрепить PDF</ModernButton>
          {pdf && <Text style={{ color: '#fff', marginTop: 8, marginBottom: 8 }}>PDF прикреплён</Text>}
          <ModernButton onPress={() => navigation.goBack()} iconRight={<Feather name="check" size={22} color="#2563EB" />}>Создать</ModernButton>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="CreateFolder" component={CreateFolderScreen} />
        <Stack.Screen name="Folder" component={FolderScreen} />
        <Stack.Screen name="Topic" component={TopicScreen} />
        <Stack.Screen name="Cards" component={CardsScreen} />
        <Stack.Screen name="Quiz" component={QuizScreen} />
        <Stack.Screen name="QuizResults" component={QuizResultsScreen} />
        <Stack.Screen name="CreateCourse" component={CreateCourseScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  headerBox: {
    alignItems: 'center',
    marginTop: '13%',
    marginBottom: 20,
  },
  title: {
    color: TEXT_MAIN,
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  subtitle: {
    color: TEXT_SECONDARY,
    fontSize: 15,
    marginBottom: 0,
    textAlign: 'center',
    alignSelf: 'center',
    maxWidth: 320,
  },
  folderCardShadow: {
    borderRadius: 32,
    marginHorizontal: 18,
    marginBottom: 18,
    shadowColor: CARD_SHADOW,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.7,
    shadowRadius: 24,
    elevation: 12,
  },
  folderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 32,
    paddingVertical: 18,
    paddingHorizontal: 22,
    borderWidth: 2,
    borderColor: CARD_BORDER,
    overflow: 'hidden',
  },
  folderIconBox: {
    marginRight: 18,
  },
  folderTitle: {
    color: TEXT_MAIN,
    fontSize: 18,
    fontWeight: '600',
  },
  folderDesc: {
    color: TEXT_SECONDARY,
    fontSize: 14,
    marginTop: 2,
  },
  emptyText: {
    color: TEXT_SECONDARY,
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SECONDARY,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 18,
    shadowColor: SECONDARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  createBtnText: {
    color: TEXT_MAIN,
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  formBox: {
    marginHorizontal: 18,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#181F2A',
    color: TEXT_MAIN,
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: CARD_BORDER,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  editIconBox: {
    marginLeft: 12,
    padding: 6,
    borderRadius: 100,
    backgroundColor: 'rgba(3,49,255,0.08)',
    alignSelf: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#181F2A',
    borderRadius: 18,
    padding: 24,
    width: 320,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  modalTitle: {
    color: TEXT_MAIN,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  deleteBtn: {
    backgroundColor: '#ff3b30',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 18,
    marginRight: 8,
  },
  deleteBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  cancelBtn: {
    backgroundColor: '#23262F',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 18,
    marginRight: 8,
  },
  cancelBtnText: {
    color: TEXT_SECONDARY,
    fontWeight: 'bold',
    fontSize: 15,
  },
  saveBtn: {
    backgroundColor: SECONDARY,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  cardsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SECONDARY,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 28,
    alignSelf: 'center',
    marginBottom: 12,
    marginTop: 0,
    shadowColor: SECONDARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 7,
  },
}); 