import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../theme/app_theme.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    );
    _scaleAnimation = CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeOutBack,
    );

    _animationController.forward();
    _startTimer();
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  void _startTimer() {
    Timer(const Duration(milliseconds: 2500), () async {
      if (!mounted) return;
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      await authProvider.checkAuth();
      if (!mounted) return;

      if (authProvider.isAuthenticated) {
        Navigator.pushReplacementNamed(context, '/dashboard');
      } else {
        Navigator.pushReplacementNamed(context, '/login');
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: AppColors.backgroundDarkGradient,
        ),
        child: Stack(
          children: [
            // Decorative background glow
            Positioned(
              top: -100,
              left: -50,
              child: Container(
                width: 250,
                height: 250,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppColors.primaryCyan.withOpacity(0.15),
                ),
              ),
            ),
            Positioned(
              bottom: -100,
              right: -50,
              child: Container(
                width: 250,
                height: 250,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppColors.accentViolet.withOpacity(0.15),
                ),
              ),
            ),
            Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  ScaleTransition(
                    scale: _scaleAnimation,
                    child: Hero(
                      tag: 'app-logo',
                      child: Container(
                        width: 120,
                        height: 120,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.primaryCyan.withOpacity(0.3),
                              blurRadius: 20,
                              spreadRadius: 5,
                            ),
                          ],
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(60),
                          child: Image.asset(
                            'assets/logo.png',
                            fit: BoxFit.cover,
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  Text(
                    'TaskFlow',
                    style: GoogleFonts.outfit(
                      fontSize: 40,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                      letterSpacing: 1.5,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Collaborate. Organize. Achieve.',
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      color: AppColors.darkTextSecondary,
                      letterSpacing: 0.5,
                    ),
                  ),
                ],
              ),
            ),
            const Positioned(
              bottom: 80,
              left: 0,
              right: 0,
              child: Center(
                child: SpinKitWave(
                  color: AppColors.primaryCyan,
                  size: 30.0,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
