// PatientDetailsScreen.tsx
import { ScreenWrapper } from "@components";
import Entypo from "@expo/vector-icons/Entypo";
import React from "react";
import {
  Text,
  TouchableOpacity,
  View
} from "react-native";
const HeaderTitle = ({ route, navigation }) => {
  const patient = route?.params || {};

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity>
            <Entypo name="chevron-left" size={28} color="#000000ff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Find Your Patients</Text>
          <TouchableOpacity>
            <Entypo name='dots-three-vertical' size={24} color="#000" />
          </TouchableOpacity>
        </View>
      </View>
    </ScreenWrapper>
  );
};
