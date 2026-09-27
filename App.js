import React, { useRef, useState } from "react";
import {
  Animated,
  Easing,
  Keyboard,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  Vibration,
  useWindowDimensions,
} from "react-native";
import Svg, { Circle, Path, Text as SvgText } from "react-native-svg";

const DEFAULT_OPTIONS = ["Pizza", "Burger", "Chicken", "Noodles"];

const COLORS = [
  "#FF6B6B",
  "#FFD93D",
  "#6BCB77",
  "#4D96FF",
  "#B980F0",
  "#FF9F68",
  "#36C2C2",
  "#FF6FB5",
  "#8D99AE",
  "#00B4D8",
  "#90BE6D",
  "#F8961E",
];

const clampLabel = (value) => {
  const trimmed = value.trim();
  return trimmed.length <= 12 ? trimmed : trimmed.slice(0, 11) + "…";
};

function wheelPath(cx, cy, radius, startAngle, endAngle) {
  const start = (startAngle - 90) * Math.PI / 180;
  const end = (endAngle - 90) * Math.PI / 180;

  const x1 = cx + radius * Math.cos(start);
  const y1 = cy + radius * Math.sin(start);
  const x2 = cx + radius * Math.cos(end);
  const y2 = cy + radius * Math.sin(end);

  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

  return `M ${cx} ${cy}
    L ${x1} ${y1}
    A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}
    Z`;
}

export default function App() {
  const { width } = useWindowDimensions();
  const wheelSize = Math.min(width - 48, 350);
  const radius = wheelSize / 2 - 5;
  const center = wheelSize / 2;

  const [options, setOptions] = useState(DEFAULT_OPTIONS);
  const [input, setInput] = useState("");
  const [winner, setWinner] = useState(null);
  const [spinning, setSpinning] = useState(false);

  const rotation = useRef(new Animated.Value(0)).current;
  const rotationRef = useRef(0);

  const resetRotation = () => {
    rotation.stopAnimation();
    rotation.setValue(0);
    rotationRef.current = 0;
    setWinner(null);
  };

  const addOption = () => {
    const value = input.trim();

    if (!value || options.length >= 12) return;

    setOptions((current) => [...current, value]);
    setInput("");
    resetRotation();
    Keyboard.dismiss();
  };

  const removeOption = (index) => {
    if (spinning) return;

    setOptions((current) =>
      current.filter((_, i) => i !== index)
    );

    resetRotation();
  };

  const resetAll = () => {
    if (spinning) return;

    setOptions(DEFAULT_OPTIONS);
    setInput("");
    resetRotation();
  };

  const spin = () => {
    if (spinning || options.length < 2) return;

    const selectedIndex = Math.floor(
      Math.random() * options.length
    );

    const segmentAngle = 360 / options.length;
    const centerAngle =
      (selectedIndex + 0.5) * segmentAngle;

    const extraSpins = 5 + Math.floor(Math.random() * 3);

    const delta =
      extraSpins * 360 +
      (360 - centerAngle);

    const target =
      rotationRef.current + delta;

    setWinner(null);
    setSpinning(true);

    Animated.timing(rotation, {
      toValue: target,
      duration: 4800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) return;

      rotationRef.current = target;
      setWinner(options[selectedIndex]);
      setSpinning(false);

      Vibration.vibrate(80);
    });
  };

  const rotate = rotation.interpolate({
    inputRange: [0, 360],
    outputRange: ["0deg", "360deg"],
    extrapolate: "extend",
  });

  const renderWheel = () => {
    const segmentAngle = 360 / options.length;

    return (
      <Svg
        width={wheelSize}
        height={wheelSize}
        viewBox={`0 0 ${wheelSize} ${wheelSize}`}
      >
        <Circle
          cx={center}
          cy={center}
          r={radius}
          fill="#171A24"
          stroke="#FFFFFF"
          strokeWidth="4"
        />

        {options.map((option, index) => {
          const start = index * segmentAngle;
          const end = (index + 1) * segmentAngle;
          const middle = (start + end) / 2;

          const labelRadius = radius * 0.62;
          const angle =
            (middle - 90) * Math.PI / 180;

          const x =
            center +
            labelRadius * Math.cos(angle);

          const y =
            center +
            labelRadius * Math.sin(angle);

          return (
            <React.Fragment
              key={`${option}-${index}`}
            >
              <Path
                d={wheelPath(
                  center,
                  center,
                  radius,
                  start,
                  end
                )}
                fill={
                  COLORS[index % COLORS.length]
                }
                stroke="#FFFFFF"
                strokeWidth="2"
              />

              <SvgText
                x={x}
                y={y}
                fill="#10121A"
                fontSize={
                  options.length > 8 ? "11" : "14"
                }
                fontWeight="800"
                textAnchor="middle"
                alignmentBaseline="middle"
              >
                {clampLabel(option)}
              </SvgText>
            </React.Fragment>
          );
        })}

        <Circle
          cx={center}
          cy={center}
          r="27"
          fill="#11131B"
          stroke="#FFFFFF"
          strokeWidth="3"
        />

        <SvgText
          x={center}
          y={center + 5}
          fill="#FFFFFF"
          fontSize="13"
          fontWeight="900"
          textAnchor="middle"
        >
          GO
        </SvgText>
      </Svg>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#0B0D12"
      />

      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>
              DECIDE
            </Text>

            <Text style={styles.subtitle}>
              Let the wheel choose.
            </Text>
          </View>

          <Pressable
            onPress={resetAll}
            disabled={spinning}
            style={({ pressed }) => [
              styles.resetButton,
              spinning && styles.disabled,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.resetText}>
              Reset
            </Text>
          </Pressable>
        </View>

        <View style={styles.wheelArea}>
          <View style={styles.pointer} />

          <Animated.View
            style={[
              styles.wheel,
              {
                width: wheelSize,
                height: wheelSize,
                transform: [{ rotate }],
              },
            ]}
          >
            {renderWheel()}
          </Animated.View>
        </View>

        <Pressable
          onPress={spin}
          disabled={
            spinning ||
            options.length < 2
          }
          style={({ pressed }) => [
            styles.spinButton,
            (spinning ||
              options.length < 2) &&
              styles.spinDisabled,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.spinText}>
            {spinning
              ? "SPINNING…"
              : options.length < 2
              ? "ADD 1 MORE OPTION"
              : "SPIN THE WHEEL"}
          </Text>
        </Pressable>

        {winner && !spinning && (
          <View style={styles.resultCard}>
            <Text style={styles.resultSmall}>
              THE WHEEL CHOSE
            </Text>

            <Text style={styles.result}>
              {winner}
            </Text>

            <Pressable
              onPress={spin}
              style={styles.againButton}
            >
              <Text style={styles.againText}>
                Spin Again
              </Text>
            </Pressable>
          </View>
        )}

        <View style={styles.optionsHeader}>
          <Text style={styles.sectionTitle}>
            Your options
          </Text>

          <Text style={styles.counter}>
            {options.length}/12
          </Text>
        </View>

        <View style={styles.addRow}>
          <TextInput
            value={input}
            onChangeText={setInput}
            onSubmitEditing={addOption}
            placeholder="Add an option…"
            placeholderTextColor="#777D8F"
            maxLength={30}
            returnKeyType="done"
            style={styles.input}
          />

          <Pressable
            onPress={addOption}
            disabled={
              !input.trim() ||
              options.length >= 12 ||
              spinning
            }
            style={({ pressed }) => [
              styles.addButton,
              (!input.trim() ||
                options.length >= 12 ||
                spinning) &&
                styles.disabled,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.addText}>
              +
            </Text>
          </Pressable>
        </View>

        <View style={styles.optionList}>
          {options.map((option, index) => (
            <View
              key={`${option}-${index}`}
              style={styles.optionRow}
            >
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      COLORS[
                        index % COLORS.length
                      ],
                  },
                ]}
              />

              <Text
                style={styles.optionText}
                numberOfLines={1}
              >
                {option}
              </Text>

              <Pressable
                onPress={() =>
                  removeOption(index)
                }
                disabled={spinning}
                hitSlop={10}
                style={({ pressed }) => [
                  styles.removeButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.removeText}>
                  ×
                </Text>
              </Pressable>
            </View>
          ))}
        </View>

        <Text style={styles.footer}>
          Everything stays on your device.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#0B0D12",
  },

  container: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 36,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: 2,
  },

  subtitle: {
    color: "#8E94A5",
    fontSize: 14,
    marginTop: 2,
  },

  resetButton: {
    borderWidth: 1,
    borderColor: "#303543",
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 12,
  },

  resetText: {
    color: "#C7CBD6",
    fontWeight: "700",
  },

  wheelArea: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    marginBottom: 18,
  },

  wheel: {
    alignItems: "center",
    justifyContent: "center",
  },

  pointer: {
    position: "absolute",
    top: -1,
    zIndex: 20,
    width: 0,
    height: 0,
    borderLeftWidth: 13,
    borderRightWidth: 13,
    borderTopWidth: 25,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#FFFFFF",
  },

  spinButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: "center",
    marginBottom: 16,
  },

  spinDisabled: {
    backgroundColor: "#343844",
  },

  spinText: {
    color: "#0B0D12",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 1,
  },

  resultCard: {
    backgroundColor: "#171A24",
    borderWidth: 1,
    borderColor: "#2C3140",
    borderRadius: 18,
    padding: 18,
    alignItems: "center",
    marginBottom: 18,
  },

  resultSmall: {
    color: "#8E94A5",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
  },

  result: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "900",
    marginTop: 5,
    marginBottom: 13,
  },

  againButton: {
    borderWidth: 1,
    borderColor: "#454B5C",
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },

  againText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },

  optionsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },

  counter: {
    color: "#777D8F",
    fontSize: 13,
    fontWeight: "700",
  },

  addRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },

  input: {
    flex: 1,
    backgroundColor: "#171A24",
    borderWidth: 1,
    borderColor: "#2C3140",
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingVertical: 13,
    color: "#FFFFFF",
    fontSize: 15,
  },

  addButton: {
    width: 52,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  addText: {
    color: "#0B0D12",
    fontSize: 28,
    lineHeight: 30,
    fontWeight: "500",
  },

  optionList: {
    gap: 8,
  },

  optionRow: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#141720",
    borderRadius: 13,
    paddingHorizontal: 13,
  },

  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 11,
  },

  optionText: {
    flex: 1,
    color: "#E9EBF0",
    fontSize: 15,
    fontWeight: "600",
  },

  removeButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },

  removeText: {
    color: "#777D8F",
    fontSize: 25,
    fontWeight: "300",
  },

  footer: {
    textAlign: "center",
    color: "#555B6A",
    fontSize: 12,
    marginTop: 22,
  },

  disabled: {
    opacity: 0.45,
  },

  pressed: {
    opacity: 0.72,
  },
});
