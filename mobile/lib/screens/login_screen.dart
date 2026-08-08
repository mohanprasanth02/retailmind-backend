import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:retailmind_mobile/services/firebase_service.dart';
import 'package:retailmind_mobile/screens/register_screen.dart';
import 'package:retailmind_mobile/screens/home_screen.dart';
import 'dart:math' as math;

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen>
    with TickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  bool _loading = false;
  bool _obscurePassword = true;
  String? _errorMessage;

  // Animation controllers
  late AnimationController _bgController;
  late AnimationController _fadeController;
  late AnimationController _pulseController;
  late Animation<double> _fadeAnim;
  late Animation<Offset> _slideAnim;

  @override
  void initState() {
    super.initState();
    _bgController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 12),
    )..repeat();

    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2000),
    )..repeat(reverse: true);

    _fadeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    );
    _fadeAnim = CurvedAnimation(
      parent: _fadeController,
      curve: Curves.easeOutCubic,
    );
    _slideAnim = Tween<Offset>(
      begin: const Offset(0, 0.06),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _fadeController, curve: Curves.easeOutCubic));

    _fadeController.forward();
  }

  @override
  void dispose() {
    _bgController.dispose();
    _pulseController.dispose();
    _fadeController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _loading = true;
      _errorMessage = null;
    });
    final fbService = Provider.of<FirebaseService>(context, listen: false);
    try {
      final user = await fbService.signIn(
        _emailController.text.trim(),
        _passwordController.text.trim(),
      );
      if (user != null && mounted) {
        Navigator.of(context).pushReplacement(
          PageRouteBuilder(
            pageBuilder: (_, __, ___) => const HomeScreen(),
            transitionDuration: const Duration(milliseconds: 500),
            transitionsBuilder: (_, anim, __, child) =>
                FadeTransition(opacity: anim, child: child),
          ),
        );
      }
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceAll('Exception:', '').trim();
      });
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;

    return Scaffold(
      backgroundColor: const Color(0xFF060608),
      body: Stack(
        children: [
          // ── Animated orb background ──────────────────────────────────
          AnimatedBuilder(
            animation: _bgController,
            builder: (context, _) {
              final t = _bgController.value;
              return CustomPaint(
                size: Size(size.width, size.height),
                painter: _OrbPainter(t),
              );
            },
          ),

          // ── Dot-grid overlay (pure paint, no asset needed) ──────────────
          Positioned.fill(
            child: CustomPaint(
              painter: _DotGridPainter(),
            ),
          ),


          // ── Main content ─────────────────────────────────────────────
          SafeArea(
            child: SingleChildScrollView(
              physics: const BouncingScrollPhysics(),
              child: FadeTransition(
                opacity: _fadeAnim,
                child: SlideTransition(
                  position: _slideAnim,
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(24, 40, 24, 24),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // ── Logo mark ──────────────────────────────────
                        Row(
                          children: [
                            Container(
                              width: 40,
                              height: 40,
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(12),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.white.withOpacity(0.25),
                                    blurRadius: 20,
                                    spreadRadius: 2,
                                  ),
                                ],
                              ),
                              child: const Icon(
                                Icons.auto_awesome_rounded,
                                color: Color(0xFF060608),
                                size: 20,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'RETAILMIND',
                                  style: TextStyle(
                                    fontSize: 15,
                                    fontWeight: FontWeight.w900,
                                    letterSpacing: 2.5,
                                    color: Colors.white,
                                  ),
                                ),
                                Text(
                                  'AI OPERATIONS',
                                  style: TextStyle(
                                    fontSize: 9,
                                    fontWeight: FontWeight.w600,
                                    letterSpacing: 2,
                                    color: Colors.white.withOpacity(0.3),
                                  ),
                                ),
                              ],
                            ),
                            const Spacer(),
                            // Live pulse badge
                            AnimatedBuilder(
                              animation: _pulseController,
                              builder: (_, __) => Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 10, vertical: 5),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF34D399).withOpacity(
                                      0.08 + 0.04 * _pulseController.value),
                                  borderRadius: BorderRadius.circular(20),
                                  border: Border.all(
                                    color: const Color(0xFF34D399)
                                        .withOpacity(0.25),
                                  ),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Container(
                                      width: 6,
                                      height: 6,
                                      decoration: BoxDecoration(
                                        shape: BoxShape.circle,
                                        color: const Color(0xFF34D399)
                                            .withOpacity(0.5 +
                                                0.5 * _pulseController.value),
                                      ),
                                    ),
                                    const SizedBox(width: 5),
                                    const Text(
                                      'SECURE',
                                      style: TextStyle(
                                        fontSize: 9,
                                        fontWeight: FontWeight.bold,
                                        letterSpacing: 0.8,
                                        color: Color(0xFF34D399),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),

                        const SizedBox(height: 64),

                        // ── Heading ────────────────────────────────────
                        Text(
                          'Welcome\nback.',
                          style: TextStyle(
                            fontSize: 42,
                            fontWeight: FontWeight.w900,
                            color: Colors.white,
                            height: 1.1,
                            letterSpacing: -1.5,
                            shadows: [
                              Shadow(
                                color: Colors.white.withOpacity(0.1),
                                blurRadius: 30,
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 10),
                        Text(
                          'Sign in to your RetailMind AI dashboard\nand manage your smart retail operations.',
                          style: TextStyle(
                            fontSize: 13,
                            color: Colors.white.withOpacity(0.38),
                            height: 1.6,
                          ),
                        ),

                        const SizedBox(height: 44),

                        // ── Glass form card ────────────────────────────
                        Container(
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.032),
                            borderRadius: BorderRadius.circular(24),
                            border: Border.all(
                              color: Colors.white.withOpacity(0.09),
                              width: 1.2,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.white.withOpacity(0.02),
                                blurRadius: 40,
                                spreadRadius: 0,
                              ),
                            ],
                          ),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(24),
                            child: Form(
                              key: _formKey,
                              child: Padding(
                                padding: const EdgeInsets.all(24),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.stretch,
                                  children: [
                                    // Error message
                                    if (_errorMessage != null) ...[
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                            horizontal: 14, vertical: 12),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFF87171)
                                              .withOpacity(0.08),
                                          borderRadius: BorderRadius.circular(12),
                                          border: Border.all(
                                            color: const Color(0xFFF87171)
                                                .withOpacity(0.2),
                                          ),
                                        ),
                                        child: Row(
                                          children: [
                                            const Icon(
                                              Icons.error_outline_rounded,
                                              size: 15,
                                              color: Color(0xFFF87171),
                                            ),
                                            const SizedBox(width: 8),
                                            Expanded(
                                              child: Text(
                                                _errorMessage!,
                                                style: const TextStyle(
                                                  color: Color(0xFFF87171),
                                                  fontSize: 12,
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      const SizedBox(height: 16),
                                    ],

                                    // Email field
                                    _PremiumField(
                                      controller: _emailController,
                                      label: 'Email Address',
                                      icon: Icons.alternate_email_rounded,
                                      keyboardType: TextInputType.emailAddress,
                                      validator: (v) {
                                        if (v == null || v.isEmpty)
                                          return 'Email is required';
                                        if (!v.contains('@'))
                                          return 'Enter a valid email';
                                        return null;
                                      },
                                    ),
                                    const SizedBox(height: 14),

                                    // Password field
                                    _PremiumField(
                                      controller: _passwordController,
                                      label: 'Password',
                                      icon: Icons.lock_outline_rounded,
                                      obscureText: _obscurePassword,
                                      suffixIcon: IconButton(
                                        icon: Icon(
                                          _obscurePassword
                                              ? Icons.visibility_off_outlined
                                              : Icons.visibility_outlined,
                                          size: 18,
                                          color: Colors.white.withOpacity(0.3),
                                        ),
                                        onPressed: () => setState(
                                            () => _obscurePassword =
                                                !_obscurePassword),
                                      ),
                                      validator: (v) {
                                        if (v == null || v.isEmpty)
                                          return 'Password is required';
                                        if (v.length < 6)
                                          return 'Minimum 6 characters';
                                        return null;
                                      },
                                    ),
                                    const SizedBox(height: 28),

                                    // Sign in button
                                    _SignInButton(
                                      loading: _loading,
                                      onTap: _handleLogin,
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ),

                        const SizedBox(height: 28),

                        // ── Register link ──────────────────────────────
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              "New to RetailMind? ",
                              style: TextStyle(
                                fontSize: 13,
                                color: Colors.white.withOpacity(0.3),
                              ),
                            ),
                            GestureDetector(
                              onTap: () => Navigator.of(context).push(
                                MaterialPageRoute(
                                    builder: (_) => const RegisterScreen()),
                              ),
                              child: const Text(
                                'Create Account →',
                                style: TextStyle(
                                  fontSize: 13,
                                  color: Colors.white,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ),
                          ],
                        ),

                        const SizedBox(height: 40),

                        // ── Features row ───────────────────────────────
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            _FeatureBadge(
                                icon: Icons.bolt_rounded, label: 'AI Powered'),
                            const SizedBox(width: 12),
                            _FeatureBadge(
                                icon: Icons.shield_outlined, label: 'Encrypted'),
                            const SizedBox(width: 12),
                            _FeatureBadge(
                                icon: Icons.sync_rounded, label: 'Real-time'),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Premium text field ───────────────────────────────────────────────────────
class _PremiumField extends StatefulWidget {
  final TextEditingController controller;
  final String label;
  final IconData icon;
  final bool obscureText;
  final Widget? suffixIcon;
  final TextInputType? keyboardType;
  final String? Function(String?)? validator;

  const _PremiumField({
    required this.controller,
    required this.label,
    required this.icon,
    this.obscureText = false,
    this.suffixIcon,
    this.keyboardType,
    this.validator,
  });

  @override
  State<_PremiumField> createState() => _PremiumFieldState();
}

class _PremiumFieldState extends State<_PremiumField> {
  bool _focused = false;

  @override
  Widget build(BuildContext context) {
    return Focus(
      onFocusChange: (f) => setState(() => _focused = f),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        decoration: BoxDecoration(
          color: _focused
              ? Colors.white.withOpacity(0.05)
              : Colors.white.withOpacity(0.025),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: _focused
                ? Colors.white.withOpacity(0.25)
                : Colors.white.withOpacity(0.08),
            width: _focused ? 1.5 : 1,
          ),
        ),
        child: TextFormField(
          controller: widget.controller,
          obscureText: widget.obscureText,
          keyboardType: widget.keyboardType,
          validator: widget.validator,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
          decoration: InputDecoration(
            labelText: widget.label,
            labelStyle: TextStyle(
              color: Colors.white.withOpacity(0.35),
              fontSize: 13,
            ),
            prefixIcon: Icon(
              widget.icon,
              size: 18,
              color: _focused
                  ? Colors.white.withOpacity(0.6)
                  : Colors.white.withOpacity(0.25),
            ),
            suffixIcon: widget.suffixIcon,
            border: InputBorder.none,
            contentPadding: const EdgeInsets.symmetric(
                horizontal: 16, vertical: 16),
          ),
        ),
      ),
    );
  }
}

// ── Sign in button ───────────────────────────────────────────────────────────
class _SignInButton extends StatefulWidget {
  final bool loading;
  final VoidCallback onTap;

  const _SignInButton({required this.loading, required this.onTap});

  @override
  State<_SignInButton> createState() => _SignInButtonState();
}

class _SignInButtonState extends State<_SignInButton> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => setState(() => _pressed = true),
      onTapUp: (_) {
        setState(() => _pressed = false);
        if (!widget.loading) widget.onTap();
      },
      onTapCancel: () => setState(() => _pressed = false),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 120),
        height: 54,
        decoration: BoxDecoration(
          color: _pressed
              ? Colors.white.withOpacity(0.88)
              : Colors.white,
          borderRadius: BorderRadius.circular(14),
          boxShadow: _pressed
              ? []
              : [
                  BoxShadow(
                    color: Colors.white.withOpacity(0.15),
                    blurRadius: 24,
                    spreadRadius: 0,
                    offset: const Offset(0, 4),
                  ),
                ],
        ),
        child: widget.loading
            ? const Center(
                child: SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2.5,
                    color: Color(0xFF060608),
                  ),
                ),
              )
            : const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    'SIGN IN',
                    style: TextStyle(
                      color: Color(0xFF060608),
                      fontSize: 13,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 1.5,
                    ),
                  ),
                  SizedBox(width: 8),
                  Icon(
                    Icons.arrow_forward_rounded,
                    color: Color(0xFF060608),
                    size: 16,
                  ),
                ],
              ),
      ),
    );
  }
}

// ── Feature badge ────────────────────────────────────────────────────────────
class _FeatureBadge extends StatelessWidget {
  final IconData icon;
  final String label;

  const _FeatureBadge({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.03),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withOpacity(0.07)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: Colors.white.withOpacity(0.3)),
          const SizedBox(width: 5),
          Text(
            label,
            style: TextStyle(
              fontSize: 10,
              color: Colors.white.withOpacity(0.3),
              fontWeight: FontWeight.w600,
              letterSpacing: 0.3,
            ),
          ),
        ],
      ),
    );
  }
}

// ── Animated orb background painter ─────────────────────────────────────────
class _OrbPainter extends CustomPainter {
  final double t;
  _OrbPainter(this.t);

  @override
  void paint(Canvas canvas, Size size) {
    if (size.width == 0 || size.height == 0) return; // guard against zero-size canvas

    void drawOrb(double cx, double cy, double r, Color c, double phase) {
      if (r <= 0) return; // guard against zero radius
      final dx = math.sin((t + phase) * 2 * math.pi) * size.width * 0.08;
      final dy = math.cos((t * 0.7 + phase) * 2 * math.pi) * size.height * 0.06;
      final paint = Paint()
        ..shader = RadialGradient(
          colors: [c.withOpacity(0.18), c.withOpacity(0.0)],
        ).createShader(Rect.fromCircle(
          center: Offset(cx * size.width + dx, cy * size.height + dy),
          radius: r,
        ));
      canvas.drawCircle(
        Offset(cx * size.width + dx, cy * size.height + dy),
        r,
        paint,
      );
    }

    // Blue — top left
    drawOrb(0.1, 0.15, size.width * 0.55, const Color(0xFF60A5FA), 0.0);
    // Violet — top right
    drawOrb(0.9, 0.12, size.width * 0.45, const Color(0xFFA78BFA), 0.33);
    // Emerald — bottom center
    drawOrb(0.5, 0.85, size.width * 0.40, const Color(0xFF34D399), 0.66);
    // Rose — mid left
    drawOrb(0.05, 0.6, size.width * 0.30, const Color(0xFFFB7185), 0.5);
  }


  @override
  bool shouldRepaint(_OrbPainter old) => old.t != t;
}

// ── Dot grid painter ─────────────────────────────────────────────────────────
class _DotGridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white.withOpacity(0.03)
      ..style = PaintingStyle.fill;

    const spacing = 28.0;
    const radius = 1.0;

    for (double x = 0; x < size.width; x += spacing) {
      for (double y = 0; y < size.height; y += spacing) {
        canvas.drawCircle(Offset(x, y), radius, paint);
      }
    }
  }

  @override
  bool shouldRepaint(_DotGridPainter old) => false;
}

