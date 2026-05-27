import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppColors {
  // Dark Theme Colors
  static const Color darkBg = Color(0xFF0F172A);
  static const Color darkCard = Color(0xFF1E293B);
  static const Color darkBorder = Color(0xFF334155);
  static const Color darkText = Color(0xFFF1F5F9);
  static const Color darkTextSecondary = Color(0xFF94A3B8);

  // Light Theme Colors
  static const Color lightBg = Color(0xFFFFFFFF);
  static const Color lightCard = Color(0xFFF8FAFC);
  static const Color lightBorder = Color(0xFFE2E8F0);
  static const Color lightText = Color(0xFF0F172A);
  static const Color lightTextSecondary = Color(0xFF64748B);

  // Common Brand Colors
  static const Color primaryCyan = Color(0xFF06B6D4);
  static const Color primaryBlue = Color(0xFF0284C7);
  static const Color accentViolet = Color(0xFF8B5CF6);
  static const Color successGreen = Color(0xFF10B981);
  static const Color warningYellow = Color(0xFFF59E0B);
  static const Color dangerRed = Color(0xFFEF4444);

  // Gradients
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [primaryCyan, primaryBlue],
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
  );

  static const LinearGradient backgroundDarkGradient = LinearGradient(
    colors: [Color(0xFF0F172A), Color(0xFF1E293B)],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );

  static const LinearGradient backgroundLightGradient = LinearGradient(
    colors: [Color(0xFFFFFFFF), Color(0xFFF8FAFC)],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );
}

class AppTheme {
  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: AppColors.darkBg,
      cardColor: AppColors.darkCard,
      dividerColor: AppColors.darkBorder,
      primaryColor: AppColors.primaryCyan,
      colorScheme: const ColorScheme.dark(
        primary: AppColors.primaryCyan,
        secondary: AppColors.primaryBlue,
        tertiary: AppColors.accentViolet,
        surface: AppColors.darkCard,
        error: AppColors.dangerRed,
      ),
      textTheme: GoogleFonts.interTextTheme(ThemeData.dark().textTheme).copyWith(
        bodyLarge: GoogleFonts.inter(color: AppColors.darkText, fontSize: 16),
        bodyMedium: GoogleFonts.inter(color: AppColors.darkTextSecondary, fontSize: 14),
        titleLarge: GoogleFonts.inter(color: AppColors.darkText, fontSize: 20, fontWeight: FontWeight.bold),
        titleMedium: GoogleFonts.inter(color: AppColors.darkText, fontSize: 16, fontWeight: FontWeight.w600),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.darkBg,
        elevation: 0,
        centerTitle: true,
        iconTheme: IconThemeData(color: AppColors.darkText),
        titleTextStyle: TextStyle(color: AppColors.darkText, fontSize: 18, fontWeight: FontWeight.bold),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.darkCard,
        hintStyle: const TextStyle(color: AppColors.darkTextSecondary, fontSize: 14),
        labelStyle: const TextStyle(color: AppColors.darkText, fontSize: 14),
        prefixIconColor: AppColors.darkTextSecondary,
        suffixIconColor: AppColors.darkTextSecondary,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.darkBorder, width: 1),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.primaryCyan, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.dangerRed, width: 1),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.dangerRed, width: 1.5),
        ),
      ),
      buttonTheme: const ButtonThemeData(
        buttonColor: AppColors.primaryCyan,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          foregroundColor: Colors.white,
          backgroundColor: Colors.transparent,
          shadowColor: Colors.transparent,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),
    );
  }

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      scaffoldBackgroundColor: AppColors.lightBg,
      cardColor: AppColors.lightCard,
      dividerColor: AppColors.lightBorder,
      primaryColor: AppColors.primaryBlue,
      colorScheme: const ColorScheme.light(
        primary: AppColors.primaryBlue,
        secondary: AppColors.primaryCyan,
        tertiary: AppColors.accentViolet,
        surface: AppColors.lightCard,
        error: AppColors.dangerRed,
      ),
      textTheme: GoogleFonts.interTextTheme(ThemeData.light().textTheme).copyWith(
        bodyLarge: GoogleFonts.inter(color: AppColors.lightText, fontSize: 16),
        bodyMedium: GoogleFonts.inter(color: AppColors.lightTextSecondary, fontSize: 14),
        titleLarge: GoogleFonts.inter(color: AppColors.lightText, fontSize: 20, fontWeight: FontWeight.bold),
        titleMedium: GoogleFonts.inter(color: AppColors.lightText, fontSize: 16, fontWeight: FontWeight.w600),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.lightBg,
        elevation: 0,
        centerTitle: true,
        iconTheme: IconThemeData(color: AppColors.lightText),
        titleTextStyle: TextStyle(color: AppColors.lightText, fontSize: 18, fontWeight: FontWeight.bold),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.lightCard,
        hintStyle: const TextStyle(color: AppColors.lightTextSecondary, fontSize: 14),
        labelStyle: const TextStyle(color: AppColors.lightText, fontSize: 14),
        prefixIconColor: AppColors.lightTextSecondary,
        suffixIconColor: AppColors.lightTextSecondary,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.lightBorder, width: 1),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.primaryBlue, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.dangerRed, width: 1),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.dangerRed, width: 1.5),
        ),
      ),
      buttonTheme: const ButtonThemeData(
        buttonColor: AppColors.primaryBlue,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          foregroundColor: Colors.white,
          backgroundColor: Colors.transparent,
          shadowColor: Colors.transparent,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),
    );
  }
}
