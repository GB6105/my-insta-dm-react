import { StyleSheet, Text, View } from 'react-native';

// DM 메인 화면 — Task 5에서 WebViewDM + 알림 연결 예정
export default function DMScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Instagram DM 준비 중...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 16,
  },
});
