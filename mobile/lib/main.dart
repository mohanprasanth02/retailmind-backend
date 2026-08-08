import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart' hide FirebaseService;
import 'package:provider/provider.dart';
import 'package:retailmind_mobile/services/firebase_service.dart';
import 'package:retailmind_mobile/screens/login_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  bool firebaseSuccess = false;
  try {
    // Attempt Firebase Core initialization
    await Firebase.initializeApp();
    firebaseSuccess = true;
    print('[Firebase Core] Success. Mobile client is live.');
  } catch (e) {
    print('[Firebase Core] Missing config / platform setup: $e');
    print('[Firebase Core] Entering local API fallback configuration.');
  }

  final fbService = FirebaseService();
  fbService.isFirebaseInitialized = firebaseSuccess;
  await fbService.detectBackend();

  runApp(
    Provider<FirebaseService>.value(
      value: fbService,
      child: const RetailMindApp(),
    ),
  );
}

class RetailMindApp extends StatelessWidget {
  const RetailMindApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'RetailMind Client',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF000000),
        primaryColor: const Color(0xFFFFFFFF), // White Accent
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFFFFFFFF),
          secondary: Color(0xFFD4D4D4),
          surface: Color(0xFF171717),
          background: Color(0xFF000000),
          error: Color(0xFF737373),
        ),
        textTheme: const TextTheme(
          titleLarge: TextStyle(fontFamily: 'sans-serif', fontWeight: FontWeight.bold, letterSpacing: 0.5),
          bodyMedium: TextStyle(fontFamily: 'sans-serif', color: Color(0xFFA3A3A3)),
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFF0A0A0A),
          elevation: 0,
          centerTitle: true,
          titleTextStyle: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            letterSpacing: 1.0,
            color: Colors.white,
          ),
        ),
        cardTheme: CardThemeData(
          color: const Color(0xFF171717),
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
            side: const BorderSide(color: Color(0xFF262626), width: 0.8),
          ),
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: const Color(0xFF0A0A0A),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: const BorderSide(color: Color(0xFF262626)),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: const BorderSide(color: Color(0xFF262626)),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: const BorderSide(color: Color(0xFFFFFFFF), width: 1.5),
          ),
          labelStyle: const TextStyle(color: Color(0xFF737373)),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFFFFFFFF),
            foregroundColor: const Color(0xFF000000),
            elevation: 0,
            padding: const EdgeInsets.symmetric(vertical: 14),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
            textStyle: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.bold,
              letterSpacing: 0.8,
            ),
          ),
        ),
      ),
      home: const LoginScreen(),
    );
  }
}
