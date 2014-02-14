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
    /// Interaction logic for JakoControl.xaml
    /// </summary>
    public partial class JakoControl : UserControl
    {
        public int Points1 { get { return puolue1CardTB.Points + puolue1BonusTB.Points; } }
        public int Points2 { get { return puolue2CardTB.Points + puolue2BonusTB.Points; } }


        public JakoControl(int roundNumber, string player)
        {
            InitializeComponent();
            titleLabel.Content = String.Format("Jako {0} ({1})", roundNumber, player);
        }

        public void SetTotals(int points1, int points2)
        {
            total1Label.Content = points1;
            total2Label.Content = points2;
        }
    }
}
