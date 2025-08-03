import { Button } from "./src/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./src/components/ui/card"
import { Badge } from "./src/components/ui/badge"
import { Input } from "./src/components/ui/input"
import { Label } from "./src/components/ui/label"
import {
  Mic,
  Settings,
  Share2,
  Clock,
  Shield,
  Sparkles,
  CheckCircle,
  Star,
  Headphones,
  Play,
  ArrowRight,
  X,
} from "lucide-react"
import { useState } from "react"
import { useAuth } from "./src/AuthContext"


// --- Login Modal Component ---
const LoginModal = ({ onClose }) => {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleEmailLogin = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const response = await fetch('/api/auth/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    username: email,
                    password: password,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                login(data.access_token);
                onClose(); // Close modal on successful login
            } else {
                const errorData = await response.json();
                setError(errorData.detail || 'Invalid email or password.');
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Sign In</CardTitle>
                    <Button variant="ghost" size="sm" onClick={onClose}><X className="w-4 h-4" /></Button>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleEmailLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        </div>
                        {error && <p className="text-sm text-red-500">{error}</p>}
                        <Button type="submit" className="w-full">Sign In with Email</Button>
                    </form>
                    <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                        <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-muted-foreground">Or continue with</span></div>
                    </div>
                    <a href="/api/auth/login/google" className="block">
                        <Button variant="outline" className="w-full">
                            Sign In with Google
                        </Button>
                    </a>
                </CardContent>
            </Card>
        </div>
    );
};


export default function PodcastPlusLanding() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const handlePlayDemo = () => {
    setIsPlaying(!isPlaying)
  }

  return (
    <div className="min-h-screen bg-white">
      {isLoginModalOpen && <LoginModal onClose={() => setIsLoginModalOpen(false)} />}
      
      {/* Navigation Header */}
      <nav className="px-4 py-4 border-b border-gray-100">
        <div className="container mx-auto max-w-6xl flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Headphones className="w-8 h-8" style={{ color: "#2C3E50" }} />
            <span className="text-2xl font-bold" style={{ color: "#2C3E50" }}>
              Podcast Plus
            </span>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <a href="#how-it-works" className="text-gray-600 hover:text-gray-800 transition-colors">How It Works</a>
            <a href="#testimonials" className="text-gray-600 hover:text-gray-800 transition-colors">Reviews</a>
            <a href="#faq" className="text-gray-600 hover:text-gray-800 transition-colors">FAQ</a>
            <Button
              onClick={() => setIsLoginModalOpen(true)}
              variant="outline"
              className="border-2 bg-transparent"
              style={{ borderColor: "#2C3E50", color: "#2C3E50" }}>
              Sign In
            </Button>
          </div>
        </div>
      </nav>
      {/* Hero Section */}
      <section className="px-4 py-16 md:py-24 lg:py-32 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 opacity-30"></div>
        <div className="container mx-auto max-w-5xl text-center relative z-10">
          <Badge
            className="mb-6 px-4 py-2 text-sm font-medium"
            style={{ backgroundColor: "#ECF0F1", color: "#2C3E50" }}>
            🎉 Over 10,000 podcasters trust Podcast Plus
          </Badge>

          <h1
            className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
            style={{ color: "#2C3E50" }}>
            Podcast Plus
          </h1>
          <p
            className="text-xl md:text-2xl lg:text-3xl mb-8 text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Your Voice, Published. No Tech Headaches, No Wasted Time.
          </p>
          <p className="text-lg md:text-xl mb-12 text-gray-500 max-w-3xl mx-auto">
            Join thousands of creators who've discovered the joy of effortless podcasting.
            <strong className="text-gray-700"> Average setup time: Under 5 minutes.</strong>
          </p>

          <div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button
              size="lg"
              className="text-lg px-8 py-6 rounded-lg font-semibold text-white hover:opacity-90 transition-all transform hover:scale-105 shadow-lg"
              style={{ backgroundColor: "#2C3E50" }}>
              Start Your Free Podcast
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="text-lg px-8 py-6 rounded-lg font-semibold border-2 hover:bg-gray-50 transition-all bg-transparent"
              style={{ borderColor: "#2C3E50", color: "#2C3E50" }}
              onClick={handlePlayDemo}>
              <Play className="mr-2 w-5 h-5" />
              Watch 2-Min Demo
            </Button>
          </div>

          <div
            className="flex flex-col sm:flex-row justify-center items-center gap-6 text-sm text-gray-500">
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
              Free 14-day trial
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
              No credit card required
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
              Cancel anytime
            </div>
          </div>
        </div>
      </section>
      {/* Stats Section */}
      <section className="px-4 py-12" style={{ backgroundColor: "#ECF0F1" }}>
        <div className="container mx-auto max-w-4xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div
                className="text-3xl md:text-4xl font-bold mb-2"
                style={{ color: "#2C3E50" }}>
                10K+
              </div>
              <div className="text-gray-600">Active Podcasters</div>
            </div>
            <div>
              <div
                className="text-3xl md:text-4xl font-bold mb-2"
                style={{ color: "#2C3E50" }}>
                50K+
              </div>
              <div className="text-gray-600">Episodes Published</div>
            </div>
            <div>
              <div
                className="text-3xl md:text-4xl font-bold mb-2"
                style={{ color: "#2C3E50" }}>
                95%
              </div>
              <div className="text-gray-600">Customer Satisfaction</div>
            </div>
            <div>
              <div
                className="text-3xl md:text-4xl font-bold mb-2"
                style={{ color: "#2C3E50" }}>
                5 Min
              </div>
              <div className="text-gray-600">Average Setup Time</div>
            </div>
          </div>
        </div>
      </section>
      {/* How It Works Section */}
      <section id="how-it-works" className="px-4 py-16 md:py-24">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2
              className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6"
              style={{ color: "#2C3E50" }}>
              How It Works: Podcasting, Simplified.
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Three simple steps to go from idea to published podcast. No technical expertise required.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {/* Step 1 */}
            <div className="text-center group">
              <div className="relative">
                <div
                  className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all transform group-hover:scale-105">
                  <Mic className="w-12 h-12" style={{ color: "#2C3E50" }} />
                </div>
                <Badge
                  className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1">Step 1</Badge>
              </div>
              <h3
                className="text-xl md:text-2xl font-semibold mb-4"
                style={{ color: "#2C3E50" }}>
                Record or Generate Audio
              </h3>
              <p className="text-gray-600 text-lg leading-relaxed mb-4">
                Simply speak into your device, upload existing audio, or let our AI generate content from your notes.
              </p>
              <div className="text-sm text-gray-500">
                ✓ Works with any device • ✓ AI content generation • ✓ Multiple formats supported
              </div>
            </div>

            {/* Step 2 */}
            <div className="text-center group">
              <div className="relative">
                <div
                  className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all transform group-hover:scale-105">
                  <Settings className="w-12 h-12" style={{ color: "#2C3E50" }} />
                </div>
                <Badge
                  className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1">Step 2</Badge>
              </div>
              <h3
                className="text-xl md:text-2xl font-semibold mb-4"
                style={{ color: "#2C3E50" }}>
                Automate Production & Polishing
              </h3>
              <p className="text-gray-600 text-lg leading-relaxed mb-4">
                Our AI handles editing, noise reduction, music, and professional formatting automatically.
              </p>
              <div className="text-sm text-gray-500">
                ✓ Auto noise removal • ✓ Music & intros • ✓ Professional editing
              </div>
            </div>

            {/* Step 3 */}
            <div className="text-center group">
              <div className="relative">
                <div
                  className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all transform group-hover:scale-105">
                  <Share2 className="w-12 h-12" style={{ color: "#2C3E50" }} />
                </div>
                <Badge
                  className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1">Step 3</Badge>
              </div>
              <h3
                className="text-xl md:text-2xl font-semibold mb-4"
                style={{ color: "#2C3E50" }}>
                Publish & Share Instantly
              </h3>
              <p className="text-gray-600 text-lg leading-relaxed mb-4">
                Your podcast goes live on Spotify, Apple Podcasts, and 20+ platforms with just one click.
              </p>
              <div className="text-sm text-gray-500">
                ✓ 20+ platforms • ✓ Automatic distribution • ✓ Analytics included
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <Button
              size="lg"
              className="text-lg px-8 py-4 rounded-lg font-semibold text-white hover:opacity-90 transition-all"
              style={{ backgroundColor: "#2C3E50" }}>
              Try It Free for 14 Days
            </Button>
          </div>
        </div>
      </section>
      {/* Benefits Section */}
      <section className="px-4 py-16 md:py-24" style={{ backgroundColor: "#ECF0F1" }}>
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2
              className="text-3xl md:text-4xl lg:text-5xl font-bold mb-8"
              style={{ color: "#2C3E50" }}>
              Why 10,000+ Creators Choose Podcast Plus
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              <Card
                className="border-0 shadow-lg hover:shadow-xl transition-all transform hover:scale-105 bg-white">
                <CardContent className="p-8 text-center">
                  <Clock className="w-16 h-16 mx-auto mb-6" style={{ color: "#2C3E50" }} />
                  <h3 className="text-2xl font-semibold mb-4" style={{ color: "#2C3E50" }}>
                    Save 10+ Hours Per Episode
                  </h3>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    What used to take days now takes minutes. Spend your time creating content, not fighting technology.
                  </p>
                </CardContent>
              </Card>

              <Card
                className="border-0 shadow-lg hover:shadow-xl transition-all transform hover:scale-105 bg-white">
                <CardContent className="p-8 text-center">
                  <Shield className="w-16 h-16 mx-auto mb-6" style={{ color: "#2C3E50" }} />
                  <h3 className="text-2xl font-semibold mb-4" style={{ color: "#2C3E50" }}>
                    Zero Technical Knowledge Required
                  </h3>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    If you can send an email, you can create a professional podcast. We handle all the complex stuff.
                  </p>
                </CardContent>
              </Card>

              <Card
                className="border-0 shadow-lg hover:shadow-xl transition-all transform hover:scale-105 bg-white">
                <CardContent className="p-8 text-center">
                  <Sparkles className="w-16 h-16 mx-auto mb-6" style={{ color: "#2C3E50" }} />
                  <h3 className="text-2xl font-semibold mb-4" style={{ color: "#2C3E50" }}>
                    Studio-Quality Results
                  </h3>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    Professional sound quality that rivals expensive studios, without the expensive equipment.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
      {/* Testimonials */}
      <section id="testimonials" className="px-4 py-16 md:py-24">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2
              className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6"
              style={{ color: "#2C3E50" }}>
              Real Stories from Real Podcasters
            </h2>
            <div className="flex justify-center items-center mb-8">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="ml-2 text-lg text-gray-600">4.9/5 from 2,847 reviews</span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all bg-white">
              <CardContent className="p-8">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 leading-relaxed mb-6 text-lg">
                  "I was terrified of the technical side of podcasting. Podcast Plus made it so simple that I launched
                  my first episode in under 30 minutes! Now I have 50+ episodes and growing."
                </p>
                <div className="flex items-center">
                  <img
                    src="https://placehold.co/60x60/E2E8F0/A0AEC0?text=Avatar"
                    alt="Sarah Johnson"
                    width={60}
                    height={60}
                    className="rounded-full mr-4" />
                  <div>
                    <h4 className="font-semibold text-lg" style={{ color: "#2C3E50" }}>
                      Sarah Johnson
                    </h4>
                    <p className="text-gray-600">Small Business Owner • 6 months on Podcast Plus</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all bg-white">
              <CardContent className="p-8">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 leading-relaxed mb-6 text-lg">
                  "I've saved 15+ hours every week since switching to Podcast Plus. The AI editing is incredible - it
                  sounds better than when I did it manually!"
                </p>
                <div className="flex items-center">
                  <img
                    src="https://placehold.co/60x60/E2E8F0/A0AEC0?text=Avatar"
                    alt="Robert Chen"
                    width={60}
                    height={60}
                    className="rounded-full mr-4" />
                  <div>
                    <h4 className="font-semibold text-lg" style={{ color: "#2C3E50" }}>
                      Robert Chen
                    </h4>
                    <p className="text-gray-600">Retired Teacher • 1 year on Podcast Plus</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all bg-white">
              <CardContent className="p-8">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 leading-relaxed mb-6 text-lg">
                  "My podcast now reaches 10,000+ listeners monthly. The automatic distribution to all platforms was a
                  game-changer for my reach!"
                </p>
                <div className="flex items-center">
                  <img
                    src="https://placehold.co/60x60/E2E8F0/A0AEC0?text=Avatar"
                    alt="Maria Rodriguez"
                    width={60}
                    height={60}
                    className="rounded-full mr-4" />
                  <div>
                    <h4 className="font-semibold text-lg" style={{ color: "#2C3E50" }}>
                      Maria Rodriguez
                    </h4>
                    <p className="text-gray-600">Community Leader • 8 months on Podcast Plus</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      {/* FAQ Section */}
      <section
        id="faq"
        className="px-4 py-16 md:py-24"
        style={{ backgroundColor: "#ECF0F1" }}>
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2
              className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6"
              style={{ color: "#2C3E50" }}>
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to know about getting started with Podcast Plus
            </p>
          </div>

          <div className="space-y-6">
            {[
              {
                q: "Do I need any technical experience to use Podcast Plus?",
                a: "Absolutely not! Podcast Plus is designed for complete beginners. If you can use email, you can create professional podcasts with our platform.",
              },
              {
                q: "How long does it take to publish my first episode?",
                a: "Most users publish their first episode within 30 minutes of signing up. Our average setup time is under 5 minutes, and episode creation takes just a few more minutes.",
              },
              {
                q: "What platforms will my podcast be available on?",
                a: "Your podcast will automatically be distributed to 20+ major platforms including Spotify, Apple Podcasts, Google Podcasts, and many more with just one click.",
              },
              {
                q: "Is there really a free trial with no credit card required?",
                a: "Yes! You get full access to all features for 14 days completely free. No credit card required, no hidden fees, and you can cancel anytime.",
              },
              {
                q: "What if I'm not satisfied with the service?",
                a: "We offer a 30-day money-back guarantee. If you're not completely satisfied, we'll refund your payment, no questions asked.",
              },
            ].map((faq, index) => (
              <Card key={index} className="border-0 shadow-md bg-white">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-3" style={{ color: "#2C3E50" }}>
                    {faq.q}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      {/* Final CTA Section */}
      <section className="px-4 py-16 md:py-24">
        <div className="container mx-auto max-w-5xl text-center">
          <h2
            className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6"
            style={{ color: "#2C3E50" }}>
            Ready to Start Your Podcast Journey?
          </h2>
          <p
            className="text-xl md:text-2xl mb-8 text-gray-600 leading-relaxed max-w-3xl mx-auto">
            Join over 10,000 creators who've discovered the joy of effortless podcasting. Start your free trial today -
            no credit card required.
          </p>

          <div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Button
              size="lg"
              className="text-xl px-10 py-6 rounded-lg font-semibold text-white hover:opacity-90 transition-all transform hover:scale-105 shadow-lg"
              style={{ backgroundColor: "#2C3E50" }}>
              Start Your Free 14-Day Trial
              <ArrowRight className="ml-2 w-6 h-6" />
            </Button>
          </div>

          <div
            className="flex flex-col sm:flex-row justify-center items-center gap-6 text-sm text-gray-500 mb-8">
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
              14-day free trial
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
              No credit card required
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
              30-day money-back guarantee
            </div>
          </div>

          <div className="text-center">
            <Badge
              className="px-4 py-2 text-sm font-medium"
              style={{ backgroundColor: "#ECF0F1", color: "#2C3E50" }}>
              🔒 Trusted by 10,000+ podcasters worldwide
            </Badge>
          </div>
        </div>
      </section>
      {/* Footer */}
      <footer
        className="px-4 py-12 border-t border-gray-200"
        style={{ backgroundColor: "#ECF0F1" }}>
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Headphones className="w-6 h-6" style={{ color: "#2C3E50" }} />
                <span className="text-xl font-bold" style={{ color: "#2C3E50" }}>
                  Podcast Plus
                </span>
              </div>
              <p className="text-gray-600 mb-4">
                Making podcasting accessible to everyone, regardless of technical expertise.
              </p>
              <div className="flex space-x-4">
                <div className="w-8 h-8 bg-gray-300 rounded"></div>
                <div className="w-8 h-8 bg-gray-300 rounded"></div>
                <div className="w-8 h-8 bg-gray-300 rounded"></div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4" style={{ color: "#2C3E50" }}>
                Product
              </h4>
              <ul className="space-y-2 text-gray-600">
                <li>
                  <a href="#" className="hover:text-gray-800 transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-800 transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-800 transition-colors">
                    Templates
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-800 transition-colors">
                    Integrations
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4" style={{ color: "#2C3E50" }}>
                Support
              </h4>
              <ul className="space-y-2 text-gray-600">
                <li>
                  <a href="#" className="hover:text-gray-800 transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-800 transition-colors">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-800 transition-colors">
                    Tutorials
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-800 transition-colors">
                    Community
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4" style={{ color: "#2C3E50" }}>
                Company
              </h4>
              <ul className="space-y-2 text-gray-600">
                <li>
                  <a href="#" className="hover:text-gray-800 transition-colors">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-800 transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-800 transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-800 transition-colors">
                    Press
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div
            className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-600 mb-4 md:mb-0">Podcast Plus © 2025. All rights reserved.</p>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-600 hover:text-gray-800 transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-gray-800 transition-colors">
                Terms of Service
              </a>
              <a href="#" className="hover:text-gray-800 transition-colors">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
