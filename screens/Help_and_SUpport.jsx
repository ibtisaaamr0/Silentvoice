import React, { useState } from "react";
import {
  View,
  Text,
 StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  SafeAreaView,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";

const FAQS = [
  {
    q: "How accurate is sign detection?",
    a: "Silent Voice uses a trained machine learning model to recognize hand signs. Accuracy is highest in good lighting with your hand fully visible in frame. Some signs may be misrecognized if performed too quickly or partially out of frame.",
  },
  {
    q: "Can I use the app without internet?",
    a: "Sign-to-text recognition requires a connection to the app's processing server. Text-to-voice works fully offline.",
  },
  {
    q: "Which sign language does this support?",
    a: "Silent Voice is built for Pakistan Sign Language (PSL), with English and Urdu output support.",
  },
  {
    q: "How do I improve recognition accuracy?",
    a: "Hold your hand steady and fully visible in the camera frame, use good lighting, and avoid very fast or repeated motions during recording.",
  },
];

export default function HelpSupport() {
  const navigation = useNavigation();
  const isDarkMode = useSelector((state) => state.theme?.isDarkMode);
  const [expandedIndex, setExpandedIndex] = useState(null);

  const colors = {
    bg: isDarkMode ? "#0F172A" : "#F8FAFC",
    card: isDarkMode ? "#1E293B" : "#FFFFFF",
    text: isDarkMode ? "#F1F5F9" : "#1E293B",
    subtext: isDarkMode ? "#94A3B8" : "#64748B",
    border: isDarkMode ? "#334155" : "#E2E8F0",
    accent: "#6366F1",
  };

  const toggleFaq = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const contactOptions = [
    {
      icon: "email",
      label: "Email Support",
      subtitle: "support@silentvoice.app",
      action: () => Linking.openURL("mailto:support@silentvoice.app"),
    },
    {
      icon: "menu-book",
      label: "User Guide",
      subtitle: "Learn how to use every feature",
      action: () => navigation.navigate("SeeAll"),
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialIcons
            name="arrow-back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Help & Support
        </Text>

        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        <Text style={[styles.groupTitle, { color: colors.subtext }]}>
          Contact Us
        </Text>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          {contactOptions.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.row,
                index !== contactOptions.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                },
              ]}
              onPress={item.action}
            >
              <View
                style={[
                  styles.iconSquare,
                  { backgroundColor: colors.accent + "15" },
                ]}
              >
                <MaterialIcons
                  name={item.icon}
                  size={20}
                  color={colors.accent}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[styles.rowLabel, { color: colors.text }]}>
                  {item.label}
                </Text>

                <Text
                  style={[styles.rowSubtitle, { color: colors.subtext }]}
                >
                  {item.subtitle}
                </Text>
              </View>

              <MaterialIcons
                name="chevron-right"
                size={20}
                color={colors.subtext}
              />
            </TouchableOpacity>
          ))}
        </View>

        <Text
          style={[
            styles.groupTitle,
            { color: colors.subtext, marginTop: 22 },
          ]}
        >
          Frequently Asked Questions
        </Text>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          {FAQS.map((faq, index) => (
            <View
              key={index}
              style={[
                index !== FAQS.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                },
              ]}
            >
              <TouchableOpacity
                style={styles.faqHeader}
                onPress={() => toggleFaq(index)}
              >
                <Text
                  style={[styles.faqQuestion, { color: colors.text }]}
                >
                  {faq.q}
                </Text>

                <MaterialIcons
                  name={
                    expandedIndex === index
                      ? "expand-less"
                      : "expand-more"
                  }
                  size={22}
                  color={colors.subtext}
                />
              </TouchableOpacity>

              {expandedIndex === index && (
                <Text
                  style={[styles.faqAnswer, { color: colors.subtext }]}
                >
                  {faq.a}
                </Text>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },

  backButton: {
    padding: 4,
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
  },

  groupTitle: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 10,
    marginLeft: 4,
    letterSpacing: 1,
  },

  card: {
    borderRadius: 20,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },

  iconSquare: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  rowLabel: {
    fontSize: 15,
    fontWeight: "700",
  },

  rowSubtitle: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },

  faqHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },

  faqQuestion: {
    fontSize: 14,
    fontWeight: "700",
    flex: 1,
    marginRight: 10,
  },

  faqAnswer: {
    fontSize: 13,
    lineHeight: 20,
    paddingHorizontal: 16,
    paddingBottom: 16,
    fontWeight: "500",
  },
});