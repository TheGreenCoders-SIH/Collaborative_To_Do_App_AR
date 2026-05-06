import React from 'react';
import { Link } from 'react-router-dom';

const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    title: 'Team Collaboration',
    description: 'Create teams, invite members, and work together on shared tasks with real-time updates'
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Approval Workflows',
    description: 'Configurable approval rules - creator only or all members must approve before completion'
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    title: 'Performance Metrics',
    description: 'Track team performance with leaderboards, completion analytics, and approval speed metrics'
  }
];

// Client logos for social proof
const clientLogos = [
  'Acme Corp',
  'TechStart',
  'CloudBase',
  'DevFlow',
  'Innovate',
  'FastBuild'
];

// Enhanced Team Workflow Dashboard Demo
const TeamWorkflowDashboard = () => {
  const days = Array.from({ length: 35 }, (_, i) => i + 1);
  const completedDays = [1, 2, 3, 5, 6, 8, 9, 10, 12, 13, 15, 16, 17, 19, 20, 21, 22, 23, 24, 26, 27, 29, 30];
  const selectedDay = 14;
  
  // Mock data for team members
  const teamMembers = [
    { name: 'Maria L.', initial: 'M', color: 'bg-pink-500' },
    { name: 'David K.', initial: 'D', color: 'bg-blue-500' },
    { name: 'Alex W.', initial: 'A', color: 'bg-purple-500' }
  ];

  // Mock task details for selected day
  const selectedDayTasks = [
    { id: 1, title: 'API Integration', assignee: 'Maria L.', status: 'In Progress' },
    { id: 2, title: 'UI Design Review', assignee: 'David K.', status: 'Completed' }
  ];

  const comments = [
    { author: 'Alex P.', text: 'Great progress on the API!' },
    { author: 'David K.', text: 'Deploying to staging now' },
    { author: 'Alex W.', text: 'Comment!' }
  ];

  return (
    <div className="w-full bg-gradient-to-b from-slate-900 to-slate-800 rounded-2xl overflow-hidden shadow-2xl border border-slate-700">
      {/* Window Header */}
      <div className="bg-slate-950 border-b border-slate-700 px-4 py-3 flex items-center gap-2.5">
        <div className="flex gap-2">
          <div className="w-2.5 h-2.5 bg-red-500 rounded-full"></div>
          <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full"></div>
          <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
        </div>
        <span className="text-xs text-slate-400 ml-2">Team Workflow: April 2024 | Current Sprint: Gamma-X</span>
      </div>

      {/* Main Content */}
      <div className="flex h-80">
        {/* Left Sidebar */}
        <div className="w-40 border-r border-slate-700 bg-slate-800 p-3 overflow-y-auto">
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-slate-300 mb-2 px-2">ACTIVE PROJECTS</h3>
            <div className="space-y-1">
              {['API Integration', 'UI Redesign', 'Commission'].map((project, idx) => (
                <div key={idx} className="text-xs text-slate-400 px-3 py-2 rounded hover:bg-slate-700/50 cursor-pointer hover:text-slate-200 transition">
                  • {project}
                </div>
              ))}
            </div>
          </div>
          
          <div className="border-t border-slate-700 pt-3">
            <h3 className="text-xs font-semibold text-slate-300 mb-2 px-2">RECENT TEAM UPDATES</h3>
            <div className="space-y-2">
              {teamMembers.map((member, idx) => (
                <div key={idx} className="flex items-center gap-2 px-2 py-1">
                  <div className={`${member.color} w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold`}>
                    {member.initial}
                  </div>
                  <span className="text-xs text-slate-400 truncate">Assigned to {member.name.split(' ')[0]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center Calendar */}
        <div className="flex-1 border-r border-slate-700 bg-slate-800 p-4">
          <div className="mb-3">
            <span className="text-sm font-semibold text-slate-200">April 2024</span>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <span key={i} className="text-xs font-medium text-slate-500">{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const isCompleted = completedDays.includes(day);
              const isSelected = day === selectedDay;
              const isFuture = day > selectedDay;
              
              return (
                <div
                  key={day}
                  className={`
                    aspect-square flex items-center justify-center text-xs rounded relative cursor-pointer transition
                    ${isSelected ? 'bg-cyan-500/30 ring-1 ring-cyan-400 text-slate-100' : 'text-slate-400 hover:bg-slate-700/50'}
                    ${isCompleted && !isSelected ? 'bg-green-500/20' : ''}
                  `}
                >
                  {isCompleted && (
                    <svg className="w-3 h-3 text-green-400 absolute inset-0 m-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                  {!isCompleted && <span>{day}</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Sidebar - Task Details */}
        <div className="w-44 bg-slate-800 border-l border-slate-700 p-4 overflow-y-auto">
          <div className="mb-4">
            <h4 className="text-xs font-semibold text-slate-300 mb-3">TASK #14 FINAL CODE</h4>
            <p className="text-xs text-slate-400 mb-3">Review (Maria L.)</p>
            <div className="flex gap-1 mb-3">
              {teamMembers.slice(0, 2).map((member, idx) => (
                <div key={idx} className={`${member.color} w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold`}>
                  {member.initial}
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-700 pt-3">
            <h4 className="text-xs font-semibold text-slate-300 mb-2">COMMENTS</h4>
            <div className="space-y-2">
              {comments.map((comment, idx) => (
                <div key={idx} className="text-xs">
                  <p className="font-medium text-slate-300">{comment.author}</p>
                  <p className="text-slate-400 text-xs">{comment.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const HomePage = () => {
  const [selectedDayTasks] = React.useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Animated Background Gradient Elements */}
      <div className="absolute inset-0 opacity-40 pointer-events-none">
        {/* Cyan glow accent top-right */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/20 rounded-full mix-blend-screen filter blur-3xl animate-pulse" style={{ animationDuration: '4s' }}></div>
        
        {/* Purple accent bottom-left */}
        <div className="absolute bottom-0 -left-40 w-80 h-80 bg-purple-600/10 rounded-full mix-blend-screen filter blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }}></div>
        
        {/* Violet accent center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet-600/10 rounded-full mix-blend-screen filter blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }}></div>
      </div>

      {/* Enhanced Navigation */}
      <nav className="relative z-20 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">TaskFlow</span>
            </div>

            {/* Center Navigation */}
            <div className="flex items-center gap-8">
              <button className="text-sm text-slate-300 hover:text-cyan-400 font-medium transition-colors">Features</button>
              <button className="text-sm text-slate-300 hover:text-cyan-400 font-medium transition-colors">Pricing</button>
              <button className="text-sm text-slate-300 hover:text-cyan-400 font-medium transition-colors">Solutions</button>
              <button className="text-sm text-slate-300 hover:text-cyan-400 font-medium transition-colors">Customers</button>
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="px-4 py-2 text-slate-300 hover:text-white font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-cyan-500/50 transition-all"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          {/* Badge with Glow */}
          <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800/50 border border-cyan-500/30 rounded-full mb-8 backdrop-blur-sm hover:border-cyan-400/50 transition-colors">
            <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
            <span className="text-sm font-medium text-cyan-300">✨ #1 Team Task Management Platform</span>
          </div>
          
          {/* Main Heading */}
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-8 leading-tight">
            Collaborate Better,{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent animate-pulse">
              Ship Faster
            </span>
          </h1>
          
          {/* Subheading */}
          <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto mb-12 leading-relaxed">
            The modern platform for teams to manage tasks, automate workflows, and measure performance — all in one place.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              to="/register"
              className="group px-8 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-semibold text-lg hover:shadow-2xl hover:shadow-cyan-500/40 transition-all flex items-center gap-2"
            >
              Start Free Trial
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <button
              className="group px-8 py-3.5 border-2 border-slate-600 text-slate-200 rounded-lg font-semibold text-lg hover:border-cyan-400/50 hover:bg-slate-800/50 transition-all flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
              Explore Live Demo
            </button>
          </div>
        </div>

        {/* Team Workflow Dashboard Demo */}
        <div className="relative max-w-5xl mx-auto mb-16">
          <div className="relative z-10">
            <TeamWorkflowDashboard />
          </div>
          
          {/* Glow effect behind demo */}
          <div className="absolute inset-0 bg-cyan-500/10 blur-3xl rounded-3xl -z-10"></div>
        </div>

        {/* Social Proof - Client Logos */}
        <div className="mt-20 pt-12 border-t border-slate-700/50">
          <p className="text-center text-slate-400 text-sm font-medium mb-8">Trusted by leading teams worldwide</p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {clientLogos.map((logo, idx) => (
              <div key={idx} className="text-slate-600 hover:text-slate-400 transition-colors font-medium text-sm">
                {logo}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative z-10 py-24 border-t border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Everything your team needs
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Powerful features to help your team stay organized and productive
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group p-8 rounded-2xl border border-slate-700/50 hover:border-cyan-500/50 hover:bg-slate-800/50 transition-all duration-300 backdrop-blur-sm"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl flex items-center justify-center text-cyan-400 mb-5 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative z-10 py-24 border-t border-slate-700/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to transform your workflow?
          </h2>
          <p className="text-xl text-slate-400 mb-10">
            Join thousands of teams already using TaskFlow to ship faster.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-semibold hover:shadow-2xl hover:shadow-cyan-500/40 transition-all"
          >
            Get Started Free
            <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-700/50 bg-slate-900/80 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-md flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <span className="text-white font-semibold">TaskFlow</span>
            </div>
            <p className="text-slate-400 text-sm">
              © 2024 TaskFlow. Built for modern teams. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;