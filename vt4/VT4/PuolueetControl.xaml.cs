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
    /// Interaction logic for PuolueetControl.xaml
    /// </summary>
    public partial class PuolueetControl : UserControl
    {
        public delegate void PuolueetSubmitHandler(string p1, string p2, string p3, string p4);
        public event PuolueetSubmitHandler PuolueetSubmitted;

        public PuolueetControl()
        {
            InitializeComponent();
        }

        private void Button_Click(object sender, RoutedEventArgs e)
        {
            PuolueetSubmitHandler handler = PuolueetSubmitted;
            if (handler != null)
                handler.Invoke(Player1TextBox.NameText, Player2TextBox.NameText,
                    Player3TextBox.NameText, Player4TextBox.NameText);
        }
    }
}
