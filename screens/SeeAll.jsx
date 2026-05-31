import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Dimensions } from "react-native";
import * as Animatable from "react-native-animatable";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useSelector } from "react-redux"; // Import Redux hook

const { width } = Dimensions.get("window");

export default function ToolsScreen({ navigation }) {
  // Pulling theme from your Redux store
  const { mode } = useSelector((state) => state.theme); 
  const isDark = mode === 'dark';

  const tools = [
    {
      id: 1,
      title: "Sign to Text",
      icon: "hand-holding-heart",
      library: "FontAwesome5",
      color: "#FF6B6B",
      route: "Sign",
      desc: "Translate gestures"
    },
    {
      id: 2,
      title: "Text to Sign",
      icon: "textsms",
      library: "MaterialIcons",
      color: "#FF8E53",
      route: "Voice",
      desc: "Convert messages"
    },
    {
      id: 3,
      title: "Knowledge Quiz",
      icon: "quiz",
      library: "MaterialIcons",
      color: "#4FACFE",
      route: "Quiz",
      desc: "Test your skills"
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: isDark ? "#121212" : "#F8F9FA" }]}>
      
      {/* Header */}
      <Animatable.View animation="fadeInDown" duration={800} style={styles.header}>
        <View>
          <Text style={[styles.subtitle, { color: isDark ? "#AAA" : "#666" }]}>Explore</Text>
          <Text style={[styles.title, { color: isDark ? "#FFF" : "#111" }]}>Silent Voice Tools</Text>
        </View>
        <Pressable 
          onPress={() => navigation.goBack()} 
          style={[styles.backCircle, { backgroundColor: isDark ? "#333" : "#EEE" }]}
        >
          <MaterialIcons name="close" size={20} color={isDark ? "#FFF" : "#333"} />
        </Pressable>
      </Animatable.View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Modern List Grid */}
        {tools.map((tool, index) => (
          <Animatable.View 
            key={tool.id} 
            animation="fadeInUp" 
            delay={index * 100} 
            style={styles.cardWrapper}
          >
            <Pressable
              style={({ pressed }) => [
                styles.card,
                { 
                  backgroundColor: isDark ? "#1E1E1E" : "#FFF",
                  transform: [{ scale: pressed ? 0.97 : 1 }]
                }
              ]}
              onPress={() => navigation.navigate(tool.route)}
            >
              <View style={[styles.iconContainer, { backgroundColor: tool.color + "20" }]}>
                {tool.library === "FontAwesome5" ? (
                  <FontAwesome5 name={tool.icon} size={24} color={tool.color} />
                ) : (
                  <MaterialIcons name={tool.icon} size={28} color={tool.color} />
                )}
              </View>
              
              <View style={styles.textContainer}>
                <Text style={[styles.cardTitle, { color: isDark ? "#FFF" : "#111" }]}>{tool.title}</Text>
                <Text style={styles.cardDesc}>{tool.desc}</Text>
              </View>

              <MaterialIcons name="chevron-right" size={24} color="#CCC" />
            </Pressable>
          </Animatable.View>
        ))}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  backCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingBottom: 30,
  },
  cardWrapper: {
    marginBottom: 15,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 24,
    // Subtle shadow for modern look
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  iconContainer: {
    width: 55,
    height: 55,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 2,
  },
  cardDesc: {
    fontSize: 13,
    color: "#888",
    fontWeight: "500",
  },
});