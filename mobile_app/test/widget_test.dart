// This is a basic Flutter widget test for TaskFlow.
//
// To perform an interaction with a widget in your test, use the WidgetTester
// utility in the flutter_test package. For example, you can send tap and scroll
// gestures. You can also use WidgetTester to find child widgets in the widget
// tree, read text, and verify that the values of widget properties are correct.

import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:collab_todo/main.dart';
import 'package:collab_todo/providers/auth_provider.dart';
import 'package:collab_todo/providers/theme_provider.dart';

void main() {
  testWidgets('TaskFlow app smoke test', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider(create: (_) => ThemeProvider()),
          ChangeNotifierProvider(create: (_) => AuthProvider()),
        ],
        child: const TaskFlowApp(),
      ),
    );

    // Verify that Splash screen has loaded
    expect(find.text('TaskFlow'), findsOneWidget);
    expect(find.text('Collaborate. Organize. Achieve.'), findsOneWidget);
  });
}
