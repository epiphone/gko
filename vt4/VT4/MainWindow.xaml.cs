using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Navigation;
using System.Windows.Shapes;

namespace VT4
{
    /// <summary>
    /// Interaction logic for MainWindow.xaml
    /// </summary>
    public partial class MainWindow : Window
    {
        public MainWindow()
        {
            InitializeComponent();
        }

        /// <summary>
        /// Aloita uusi peli kun pelaajien nimet on syötetty.
        /// </summary>
        public void OnPuolueetSubmitted(string p1, string p2, string p3, string p4)
        {
            panel.Children.Clear();
            var jaot = new JaotControl(p1, p2, p3, p4);
            panel.Children.Add(jaot);
        }

        private void panel_SizeChanged(object sender, SizeChangedEventArgs e)
        {
            scrollViewer.ScrollToBottom();
        }
    }
}
