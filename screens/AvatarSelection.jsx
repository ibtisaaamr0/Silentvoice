import React, {useState} from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import * as RNAnimatable from 'react-native-animatable';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import {useDispatch, useSelector} from 'react-redux';
import {setSelectedAvatar} from '../Redux/features/avatarSlice';
import {AVATARS} from '../component/avatarRegistry';

const {width} = Dimensions.get('window');
const H_PAD = 20;
const CARD_GAP = 14;
const CARD_W = (width - H_PAD * 2 - CARD_GAP) / 2;
const CARD_H = CARD_W * 1.4;

export default function AvatarSelection({navigation}) {
  const dispatch = useDispatch();
  const currentId = useSelector(s => s.avatar?.selectedId ?? 'classic');
  const [pending, setPending] = useState(currentId);

  const handleConfirm = () => {
    dispatch(setSelectedAvatar(pending));
    navigation.goBack();
  };

  const renderItem = ({item, index}) => {
    const isSelected = item.id === pending;
    return (
      <RNAnimatable.View
        animation="fadeInUp"
        delay={index * 90}
        duration={480}
        useNativeDriver
        style={[ss.shadowWrap, isSelected && ss.shadowSelected]}>
        <Pressable
          onPress={() => setPending(item.id)}
          android_ripple={{color: 'rgba(255,255,255,0.1)'}}
          style={[ss.cardPressable, isSelected && ss.cardBorder]}>
          <LinearGradient
            colors={item.gradientColors}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={ss.card}>
            {isSelected && (
              <View style={ss.activeBadge}>
                <FontAwesome5 name="check" size={7} color="#0A0A0F" solid />
                <Text style={ss.activeTxt}> Active</Text>
              </View>
            )}

            <View style={ss.iconCircle}>
              <FontAwesome5
                name={item.icon}
                size={42}
                color="rgba(255,255,255,0.95)"
                solid
              />
            </View>

            <Text style={ss.cardName}>{item.name}</Text>
            <Text style={ss.cardTagline}>{item.tagline}</Text>
          </LinearGradient>
        </Pressable>
      </RNAnimatable.View>
    );
  };

  return (
    <View style={ss.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0F" />

      <RNAnimatable.View
        animation="fadeInDown"
        duration={500}
        useNativeDriver
        style={ss.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={ss.backBtn}
          android_ripple={{color: 'rgba(255,255,255,0.15)', borderless: true}}>
          <FontAwesome5 name="arrow-left" size={16} color="#fff" />
        </Pressable>
        <View style={ss.headerText}>
          <Text style={ss.headerTitle}>Choose Your Avatar</Text>
          <Text style={ss.headerSub}>Select your signing companion</Text>
        </View>
      </RNAnimatable.View>

      <FlatList
        data={AVATARS}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={ss.row}
        contentContainerStyle={ss.listContent}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
      />

      <RNAnimatable.View
        animation="fadeInUp"
        delay={420}
        duration={400}
        useNativeDriver
        style={ss.footer}>
        <Pressable onPress={handleConfirm} activeOpacity={0.88}>
          <LinearGradient
            colors={['#C8E265', '#A3C23A']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}
            style={ss.confirmBtn}>
            <FontAwesome5 name="check-circle" size={18} color="#0A0A0F" solid />
            <Text style={ss.confirmTxt}>Confirm Selection</Text>
          </LinearGradient>
        </Pressable>
      </RNAnimatable.View>
    </View>
  );
}

const ss = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },

  // ── Header ─────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 56,
    paddingHorizontal: H_PAD,
    paddingBottom: 24,
    gap: 16,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  headerText: {flex: 1},
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 3,
  },

  // ── Grid ───────────────────────────────────────────────────────────────────
  listContent: {
    paddingHorizontal: H_PAD,
    paddingBottom: 130,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: CARD_GAP,
  },

  // ── Card ───────────────────────────────────────────────────────────────────
  shadowWrap: {
    width: CARD_W,
    borderRadius: 24,
  },
  shadowSelected: {
    shadowColor: '#C8E265',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.75,
    shadowRadius: 18,
    elevation: 18,
  },
  cardPressable: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardBorder: {
    borderColor: '#C8E265',
  },
  card: {
    width: '100%',
    height: CARD_H,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  activeBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#C8E265',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  activeTxt: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0A0A0F',
    letterSpacing: 0.5,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  cardName: {
    fontSize: 19,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.3,
  },
  cardTagline: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 5,
    textAlign: 'center',
  },

  // ── Footer confirm ─────────────────────────────────────────────────────────
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: H_PAD,
    paddingBottom: 36,
    paddingTop: 16,
    backgroundColor: 'rgba(10,10,15,0.96)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 28,
    shadowColor: '#C8E265',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 14,
  },
  confirmTxt: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0A0A0F',
    letterSpacing: 0.3,
  },
});
