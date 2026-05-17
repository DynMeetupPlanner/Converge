import React from 'react';
import { ScrollView, Text, View } from 'react-native';

type Props = {
  children: React.ReactNode;
};

type State = {
  error: Error | null;
  info: React.ErrorInfo | null;
};

export class AppErrorBoundary extends React.Component<Props, State> {
  state: State = {
    error: null,
    info: null,
  };

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('App render error:', error, info.componentStack);
    this.setState({ error, info });
  }

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <View style={{ flex: 1, backgroundColor: '#08090E', padding: 20 }}>
        <ScrollView contentContainerStyle={{ paddingTop: 60 }}>
          <Text style={{ color: '#FF5C72', fontSize: 20, fontWeight: '800', marginBottom: 12 }}>
            App crashed while rendering
          </Text>
          <Text style={{ color: '#EDF0FF', fontSize: 15, lineHeight: 22, marginBottom: 16 }}>
            {this.state.error.name}: {this.state.error.message}
          </Text>
          <Text style={{ color: '#8B91B0', fontSize: 12, lineHeight: 18 }}>
            {this.state.info?.componentStack || 'No component stack available.'}
          </Text>
        </ScrollView>
      </View>
    );
  }
}
