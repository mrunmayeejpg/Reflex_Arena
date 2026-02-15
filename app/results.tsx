import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, Platform } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  FadeIn,
  ZoomIn,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useGame } from '@/contexts/GameContext';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

const LEVEL_COLORS: Record<string, string[]> = {
  'SUPERHUMAN': [Colors.accentYellow, '#FFD700'],
  'LIGHTNING': [Colors.accentPurple, '#C084FC'],
  'QUICK': [Colors.accentGreen, '#22C55E'],
  'AVERAGE': [Colors.accentBlue, '#60A5FA'],
  'SLUGGISH': [Colors.accentOrange, '#FB923C'],
  'SLEEPY': [Colors.textMuted, '#6B7280'],
};

const LEVEL_ICONS: Record<string, string> = {
  'SUPERHUMAN': 'star',
  'LIGHTNING': 'flash',
  'QUICK': 'rocket',
  'AVERAGE': 'thumbs-up',
  'SLUGGISH': 'walk',
  'SLEEPY': 'bed',
};

export default function ResultsScreen() {
  const insets = useSafeAreaInsets();
  const { scores, totalScore, reflexLevel, reflexDescription, resetScores } = useGame();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const webBottomInset = Platform.OS === 'web' ? 34 : 0;

  const scoreAnim = useSharedValue(0);
  const barWidth1 = useSharedValue(0);
  const barWidth2 = useSharedValue(0);
  const barWidth3 = useSharedValue(0);

  const levelColors = LEVEL_COLORS[reflexLevel] || [Colors.textMuted, '#6B7280'];
  const levelIcon = LEVEL_ICONS[reflexLevel] || 'help';

  const maxPossible = 300;

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    scoreAnim.value = withDelay(400, withTiming(totalScore, { duration: 1500, easing: Easing.out(Easing.ease) }));
    barWidth1.value = withDelay(800, withTiming(Math.min((scores.colorTap / 100) * 100, 100), { duration: 800 }));
    barWidth2.value = withDelay(1000, withTiming(Math.min((scores.whackMole / 100) * 100, 100), { duration: 800 }));
    barWidth3.value = withDelay(1200, withTiming(Math.min((scores.reaction / 100) * 100, 100), { duration: 800 }));
  }, []);

  const bar1Style = useAnimatedStyle(() => ({ width: `${barWidth1.value}%` as any }));
  const bar2Style = useAnimatedStyle(() => ({ width: `${barWidth2.value}%` as any }));
  const bar3Style = useAnimatedStyle(() => ({ width: `${barWidth3.value}%` as any }));

  const handlePlayAgain = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    resetScores();
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0A0A1A', '#150A20', '#0A0A1A']}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.content, { paddingTop: insets.top + webTopInset + 20, paddingBottom: insets.bottom + webBottomInset + 20 }]}>
        <Animated.View entering={FadeIn.delay(200).duration(600)} style={styles.topLabel}>
          <Text style={styles.topLabelText}>YOUR RESULTS</Text>
        </Animated.View>

        <Animated.View entering={ZoomIn.delay(400).duration(500)} style={styles.levelContainer}>
          <LinearGradient
            colors={levelColors}
            style={styles.levelIconBg}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name={levelIcon as any} size={40} color="#fff" />
          </LinearGradient>
          <Text style={[styles.levelText, { color: levelColors[0] }]}>{reflexLevel}</Text>
          <Text style={styles.levelDescription}>{reflexDescription}</Text>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(800).duration(600)} style={styles.totalScoreContainer}>
          <Text style={styles.totalLabel}>TOTAL SCORE</Text>
          <Text style={styles.totalScore}>{totalScore}</Text>
          <Text style={styles.totalMax}>/ {maxPossible}</Text>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(1000).duration(600)} style={styles.breakdownContainer}>
          <GameScoreBar
            label="Color Tap"
            score={scores.colorTap}
            color={Colors.accent}
            barStyle={bar1Style}
            icon="ellipse"
          />
          <GameScoreBar
            label="Whack-a-Mole"
            score={scores.whackMole}
            color={Colors.accentGreen}
            barStyle={bar2Style}
            icon="hammer"
          />
          <GameScoreBar
            label="Reaction"
            score={scores.reaction}
            color={Colors.accentBlue}
            barStyle={bar3Style}
            icon="timer"
          />
        </Animated.View>

        <Animated.View entering={FadeIn.delay(1400).duration(600)} style={styles.buttonContainer}>
          <Pressable
            onPress={handlePlayAgain}
            style={({ pressed }) => [styles.playAgainButton, pressed && { opacity: 0.85 }]}
          >
            <LinearGradient
              colors={[Colors.accent, Colors.accentOrange]}
              style={styles.playAgainGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="refresh" size={22} color="#fff" />
              <Text style={styles.playAgainText}>PLAY AGAIN</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

function GameScoreBar({
  label,
  score,
  color,
  barStyle,
  icon,
}: {
  label: string;
  score: number;
  color: string;
  barStyle: any;
  icon: string;
}) {
  return (
    <View style={styles.scoreBarContainer}>
      <View style={styles.scoreBarHeader}>
        <View style={styles.scoreBarLeft}>
          <Ionicons name={icon as any} size={16} color={color} />
          <Text style={styles.scoreBarLabel}>{label}</Text>
        </View>
        <Text style={[styles.scoreBarValue, { color }]}>{score}</Text>
      </View>
      <View style={styles.scoreBarTrack}>
        <Animated.View style={[styles.scoreBarFill, barStyle]}>
          <LinearGradient
            colors={[color, color + '99']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  topLabel: {
    alignItems: 'center',
  },
  topLabelText: {
    fontFamily: 'Orbitron_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    letterSpacing: 6,
  },
  levelContainer: {
    alignItems: 'center',
    gap: 12,
  },
  levelIconBg: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelText: {
    fontFamily: 'Orbitron_900Black',
    fontSize: 32,
    letterSpacing: 4,
  },
  levelDescription: {
    fontFamily: 'Orbitron_400Regular',
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
    letterSpacing: 0.5,
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  totalScoreContainer: {
    alignItems: 'center',
    gap: 2,
  },
  totalLabel: {
    fontFamily: 'Orbitron_400Regular',
    fontSize: 10,
    color: Colors.textMuted,
    letterSpacing: 4,
  },
  totalScore: {
    fontFamily: 'Orbitron_900Black',
    fontSize: 56,
    color: Colors.text,
  },
  totalMax: {
    fontFamily: 'Orbitron_400Regular',
    fontSize: 14,
    color: Colors.textMuted,
    letterSpacing: 2,
    marginTop: -8,
  },
  breakdownContainer: {
    width: '100%',
    gap: 16,
  },
  scoreBarContainer: {
    gap: 8,
  },
  scoreBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scoreBarLabel: {
    fontFamily: 'Orbitron_400Regular',
    fontSize: 11,
    color: Colors.textSecondary,
    letterSpacing: 1,
  },
  scoreBarValue: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 16,
  },
  scoreBarTrack: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 4,
    overflow: 'hidden',
    minWidth: 4,
  },
  buttonContainer: {
    width: '100%',
  },
  playAgainButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  playAgainGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  playAgainText: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 16,
    color: '#fff',
    letterSpacing: 3,
  },
});
