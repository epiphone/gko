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
    /// Interaction logic for JaotControl.xaml
    /// </summary>
    public partial class JaotControl : UserControl
    {
        private string[] players;
        private int round = 0;
        private int points1 = 0;
        private int points2 = 0;

        private JakoControl currentJako;

        public JaotControl(string p1, string p2, string p3, string p4)
        {
            InitializeComponent();

            players = new string[] { p1, p2, p3, p4 };
            StartNewRound();
        }

        private void StartNewRound()
        {
            round++;
            currentJako = new JakoControl(round, players[(round - 1) % 4]);
            panel.Children.Add(currentJako);
        }

        private void GameOver()
        {
            laskeBtn.IsEnabled = false;
            var label = new Label();
            var wTeam = points1 > points2 ? 1 : 2;
            label.Content = String.Format("Voittaja: Puolue {0} ({1} & {2}): {3} pistettä",
                wTeam, players[wTeam - 1], players[wTeam + 1], wTeam == 1 ? points1 : points2);

            panel.Children.Add(label);
        }

        private void LaskeButton_Click(object sender, RoutedEventArgs e)
        {
            if (currentJako != null)
            {
                points1 += currentJako.Points1;
                points2 += currentJako.Points2;
                currentJako.SetTotals(points1, points2);
            }

            if (points1 >= 5000 || points2 >= 5000)
                GameOver();
            else
                StartNewRound();
        }
    }
}
